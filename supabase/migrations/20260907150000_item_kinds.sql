alter table public.items
  add column kind text not null default 'produto',
  add column url text,
  add column whatsapp_message text;

alter table public.items add constraint kind_valido
  check (kind in ('produto','whatsapp','link'));

alter table public.items add constraint url_obrigatoria_para_link
  check (kind <> 'link' or (url is not null and url ~ '^https?://'));

create or replace function public.get_catalog_page(p_username citext)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object(
    'profile', to_json(p),
    'items', coalesce((
      select json_agg(x order by x.position)
      from (
        select it.id, it.slug, it.title, it.kind, it.category, it.status,
               it.price_cents, it.price_note, it.location, it.position,
               it.url, it.whatsapp_message,
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

create or replace function public.get_item_page(p_username citext, p_slug text)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  select json_build_object(
    'profile', json_build_object(
      'id', pf.id, 'username', pf.username, 'display_name', pf.display_name,
      'headline', pf.headline, 'avatar_url', pf.avatar_url,
      'whatsapp', pf.whatsapp, 'theme', pf.theme, 'plan', pf.plan),
    'item', json_build_object(
      'id', it.id, 'slug', it.slug, 'title', it.title, 'kind', it.kind,
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
    and it.kind = 'produto'
    and it.status in ('ativo','reservado');
$$;
