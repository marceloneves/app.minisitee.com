-- Ferramenta Formulario: o dono monta as perguntas, o visitante responde no
-- minisite e as respostas ficam no painel, em Respostas.
--
-- Junto, Agenda e Formulario passam a ser so do plano pro: conta free nao cria
-- nenhuma das duas e, se a conta voltar para o free, elas saem do minisite sem
-- apagar agendamentos nem respostas.
alter table public.items drop constraint kind_valido;
alter table public.items add constraint kind_valido check (
  kind in ('produto','whatsapp','link','redes','horario','endereco','telefone',
           'arquivo','faq','galeria','contagem','qrcode','agenda','formulario')
);

-- `respostas` guarda a pergunta junto com a resposta: [{rotulo, tipo, valor}].
-- Assim editar ou apagar uma pergunta depois nao embaralha o que ja chegou.
create table if not exists public.respostas_formulario (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  respostas   jsonb not null,
  lida        boolean not null default false,
  -- Hash do IP misturado com o formulario, so para limitar envios seguidos.
  ip_hash     text,
  created_at  timestamptz not null default now(),
  constraint resposta_e_lista check (jsonb_typeof(respostas) = 'array'),
  constraint resposta_tamanho check (octet_length(respostas::text) <= 64000)
);

create index if not exists respostas_formulario_profile_idx
  on public.respostas_formulario (profile_id, created_at desc);
create index if not exists respostas_formulario_item_idx
  on public.respostas_formulario (item_id, created_at desc);

alter table public.respostas_formulario enable row level security;

-- Sem policy de insert: a resposta do visitante passa pela rota
-- /api/formulario, que confere as perguntas e o limite de envios.
drop policy if exists "respostas_dono_le" on public.respostas_formulario;
create policy "respostas_dono_le" on public.respostas_formulario
  for select using (auth.uid() = profile_id);
drop policy if exists "respostas_dono_atualiza" on public.respostas_formulario;
create policy "respostas_dono_atualiza" on public.respostas_formulario
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
drop policy if exists "respostas_dono_apaga" on public.respostas_formulario;
create policy "respostas_dono_apaga" on public.respostas_formulario
  for delete using (auth.uid() = profile_id);

-- Trava do pro no banco, como o limite do free: as policies deixam o dono
-- inserir direto via PostgREST, sem passar pela server action. A action
-- reconhece o erro pela mensagem "plano pro".
create or replace function public.checar_ferramenta_pro()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  plano text;
begin
  if new.kind not in ('agenda','formulario') then
    return new;
  end if;

  select plan into plano from public.profiles where id = new.profile_id;
  if coalesce(plano, 'free') = 'free' then
    raise exception 'ferramenta do plano pro';
  end if;

  return new;
end $$;

drop trigger if exists trg_ferramenta_pro on public.items;
create trigger trg_ferramenta_pro
  before insert or update of kind on public.items
  for each row execute function public.checar_ferramenta_pro();

-- A pagina publica da conta free deixa de trazer Agenda e Formulario.
create or replace function public.get_catalog_page(p_username citext)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object(
    'profile', to_json(p),
    'items', coalesce((
      select json_agg(x order by x.position)
      from (
        select it.id, it.slug, it.title, it.kind, it.category, it.status,
               it.price_cents, it.price_note, it.location, it.position,
               it.url, it.whatsapp_message, it.data,
               (select ph.url from item_photos ph
                  where ph.item_id = it.id
                  order by ph.position limit 1) as cover_url,
               coalesce((
                 select json_agg(ph.url order by ph.position)
                 from item_photos ph where ph.item_id = it.id
               ), '[]'::json) as photos
        from items it
        where it.profile_id = p.id and it.status in ('ativo','reservado')
          and (it.kind not in ('agenda','formulario') or coalesce(p.plan, 'free') <> 'free')
      ) x), '[]'::json)
  )
  from (
    select id, username, display_name, headline, bio, avatar_url,
           whatsapp, city, theme, plan, locale
    from profiles where username = p_username
  ) p;
$$;
