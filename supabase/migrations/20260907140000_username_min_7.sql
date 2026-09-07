alter table public.profiles drop constraint username_format;
alter table public.profiles add constraint username_format
  check (username ~ '^[a-z0-9_-]{7,30}$');

create or replace function public.username_disponivel(p_username citext)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_username ~ '^[a-z0-9_-]{7,30}$'
     and not exists (select 1 from public.reserved_usernames r where r.name = p_username)
     and not exists (select 1 from public.profiles p where p.username = p_username);
$$;
