-- Logo que nao cabe num circulo: o dono escolhe se a imagem do topo aparece
-- em circulo (padrao, como sempre foi) ou em retangulo, inteira.
alter table public.profiles
  add column if not exists avatar_formato text not null default 'circulo';

alter table public.profiles drop constraint if exists avatar_formato_valido;
alter table public.profiles add constraint avatar_formato_valido
  check (avatar_formato in ('circulo','retangulo'));

-- A pagina publica passa a trazer o formato. Resto igual a
-- 20260913120000_formulario_pro.sql.
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
    select id, username, display_name, headline, bio, avatar_url, avatar_formato,
           whatsapp, city, theme, plan, locale
    from profiles where username = p_username
  ) p;
$$;
