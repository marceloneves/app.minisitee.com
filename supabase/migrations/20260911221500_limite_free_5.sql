-- O plano free passa de 3 para 5 itens. O numero tem que mudar aqui tambem:
-- o trigger e quem segura de verdade, porque as policies deixam o dono inserir
-- direto via PostgREST, sem passar pela server action.
--
-- Quem ja esta no free com 3 itens nao e afetado: o trigger so roda no insert,
-- e o limite novo e maior.
create or replace function public.checar_limite_itens()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  plano text;
  total int;
begin
  select plan into plano from public.profiles where id = new.profile_id;
  if plano is distinct from 'free' then
    return new;
  end if;

  select count(*) into total from public.items where profile_id = new.profile_id;
  if total >= 5 then
    raise exception 'limite do plano free'
      using errcode = '54000';
  end if;

  return new;
end $$;
