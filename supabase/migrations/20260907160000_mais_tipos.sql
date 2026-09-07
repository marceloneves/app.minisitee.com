alter table public.items add column data jsonb not null default '{}'::jsonb;

alter table public.items drop constraint kind_valido;
alter table public.items add constraint kind_valido check (
  kind in ('produto','whatsapp','link','redes','horario','endereco','telefone')
);

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
