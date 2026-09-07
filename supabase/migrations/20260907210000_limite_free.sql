-- O limite tem que viver no banco: as policies deixam o dono inserir direto
-- via PostgREST, entao checar so na server action nao segura nada.
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
  if total >= 3 then
    raise exception 'limite do plano free'
      using errcode = '54000';
  end if;

  return new;
end $$;

drop trigger if exists trg_limite_itens on public.items;
create trigger trg_limite_itens
  before insert on public.items
  for each row execute function public.checar_limite_itens();
