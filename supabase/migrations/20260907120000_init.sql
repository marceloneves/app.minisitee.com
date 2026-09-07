create extension if not exists citext;

-- PROFILES
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     citext unique not null,
  display_name text,
  headline     text,
  bio          text,
  avatar_url   text,
  whatsapp     text,
  city         text,
  theme        text not null default 'light',
  plan         text not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_-]{3,30}$'),
  constraint theme_valido check (theme in ('light','dark','color')),
  constraint plan_valido check (plan in ('free','pro')),
  constraint whatsapp_format check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$')
);

create table public.reserved_usernames (name citext primary key);
insert into public.reserved_usernames (name) values
  ('admin'),('api'),('app'),('auth'),('blog'),('contato'),('dashboard'),
  ('help'),('item'),('itens'),('login'),('logout'),('me'),('minisitee'),
  ('new'),('oficial'),('painel'),('privacidade'),('pro'),('settings'),
  ('signup'),('sobre'),('suporte'),('termos'),('www');

-- security definer: com RLS ligado em reserved_usernames, um trigger
-- security invoker leria zero linhas e deixaria passar todo nome reservado.
create or replace function public.check_username_reservado()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.username = lower(new.username);
  if exists (select 1 from public.reserved_usernames r where r.name = new.username) then
    raise exception 'username reservado' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger trg_username_reservado
  before insert or update of username on public.profiles
  for each row execute function public.check_username_reservado();

-- ITEMS
create table public.items (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  slug        text not null,
  title       text not null,
  description text,
  category    text,
  status      text not null default 'rascunho',
  price_cents bigint,
  price_note  text,
  location    text,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,60}$'),
  constraint slug_unico_por_perfil unique (profile_id, slug),
  constraint status_valido check (status in ('rascunho','ativo','reservado','encerrado')),
  constraint preco_positivo check (price_cents is null or price_cents >= 0)
);

create index items_publicos_idx
  on public.items (profile_id, position)
  where status in ('ativo','reservado');

-- FOTOS
create table public.item_photos (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  url        text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index photos_item_idx on public.item_photos (item_id, position);

-- EVENTS
create table public.events (
  id         bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_id    uuid references public.items(id) on delete set null,
  type       text not null,
  referrer   text,
  created_at timestamptz not null default now(),
  constraint event_type_valido check (type in ('page_view','item_view','whatsapp_click'))
);

create index events_profile_idx on public.events (profile_id, created_at desc);

-- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_touch_items before update on public.items
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.profiles           enable row level security;
alter table public.items              enable row level security;
alter table public.item_photos        enable row level security;
alter table public.events             enable row level security;
alter table public.reserved_usernames enable row level security;

revoke all on public.reserved_usernames from anon, authenticated;

-- Leitura direta fechada. As paginas publicas usam as RPCs security definer
-- abaixo, senao /rest/v1/profiles?select=whatsapp devolveria a base inteira.
create policy "profiles_dono_le" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_dono_insere" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_dono_atualiza" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "items_dono_le" on public.items
  for select using (auth.uid() = profile_id);
create policy "items_dono_escreve" on public.items
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "photos_dono" on public.item_photos
  for all using (
    exists (select 1 from public.items i
             where i.id = item_id and i.profile_id = auth.uid())
  ) with check (
    exists (select 1 from public.items i
             where i.id = item_id and i.profile_id = auth.uid())
  );

create policy "events_insere_alvo_valido" on public.events
  for insert with check (
    item_id is null or exists (
      select 1 from public.items i
      where i.id = item_id and i.profile_id = events.profile_id
    )
  );
create policy "events_dono_le" on public.events
  for select using (auth.uid() = profile_id);

-- Disponibilidade de username para o onboarding.
create or replace function public.username_disponivel(p_username citext)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_username ~ '^[a-z0-9_-]{3,30}$'
     and not exists (select 1 from public.reserved_usernames r where r.name = p_username)
     and not exists (select 1 from public.profiles p where p.username = p_username);
$$;

revoke execute on function public.username_disponivel(citext) from public;
grant execute on function public.username_disponivel(citext) to anon, authenticated;

-- RPC: pagina do catalogo
create or replace function public.get_catalog_page(p_username citext)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object(
    'profile', to_json(p),
    'items', coalesce((
      select json_agg(x order by x.position)
      from (
        select it.id, it.slug, it.title, it.category, it.status,
               it.price_cents, it.price_note, it.location, it.position,
               (select ph.url from item_photos ph
                  where ph.item_id = it.id
                  order by ph.position limit 1) as cover_url
        from items it
        where it.profile_id = p.id and it.status in ('ativo','reservado')
      ) x), '[]'::json)
  )
  from (
    select id, username, display_name, headline, bio, avatar_url,
           whatsapp, city, theme, plan
    from profiles where username = p_username
  ) p;
$$;

-- RPC: pagina do item
create or replace function public.get_item_page(p_username citext, p_slug text)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object(
    'profile', json_build_object(
      'id', pf.id, 'username', pf.username, 'display_name', pf.display_name,
      'headline', pf.headline, 'avatar_url', pf.avatar_url,
      'whatsapp', pf.whatsapp, 'theme', pf.theme, 'plan', pf.plan),
    'item', json_build_object(
      'id', it.id, 'slug', it.slug, 'title', it.title,
      'description', it.description, 'category', it.category,
      'status', it.status, 'price_cents', it.price_cents,
      'price_note', it.price_note, 'location', it.location),
    'photos', coalesce((
      select json_agg(json_build_object('url', ph.url, 'position', ph.position)
             order by ph.position)
      from item_photos ph where ph.item_id = it.id), '[]'::json)
  )
  from profiles pf
  join items it on it.profile_id = pf.id
  where pf.username = p_username
    and it.slug = p_slug
    and it.status in ('ativo','reservado');
$$;

grant execute on function public.get_catalog_page(citext) to anon, authenticated;
grant execute on function public.get_item_page(citext, text) to anon, authenticated;

-- STORAGE
insert into storage.buckets (id, name, public)
values ('media','media', true) on conflict (id) do nothing;

create policy "media_leitura_publica" on storage.objects
  for select using (bucket_id = 'media');
create policy "media_dono_envia" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_dono_atualiza" on storage.objects
  for update to authenticated using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_dono_apaga" on storage.objects
  for delete to authenticated using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
