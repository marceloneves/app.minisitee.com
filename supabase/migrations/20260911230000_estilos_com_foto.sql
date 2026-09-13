-- Trinta e sete estilos novos, cada um com uma foto de fundo servida de
-- /estilos/. Os doze ultimos tem foto escura.
-- `if exists` para a migracao poder ser rodada de novo sem quebrar no meio.
alter table public.profiles drop constraint if exists theme_valido;
alter table public.profiles add constraint theme_valido
  check (theme in (
    'light','areia','menta','oceano','rosa',
    'lago','espuma','duna','muro','pista',
    'praia','cerejeira','croco','tubarao','neon',
    'manequins','tv','robo',
    'aperto','cidade','ampolas','escamas','circuito',
    'lentes','vitrine','pintura','rosto',
    'giro','ovos','respingo','bolas','tinta','luzes',
    'alfinete','bruma','blocos','esferas','bolhas','arroz','teto',
    'fachada','gotas'
  ));

-- As fotos moram em minisitee.com/estilos/. Sem reservar o nome, alguem
-- registraria o minisite /estilos e o endereco passaria a disputar com elas.
insert into public.reserved_usernames (name) values ('estilos')
  on conflict do nothing;

-- Devolve a constraint que ficou valendo: se a lista abaixo vier com os
-- quarenta e dois estilos, a migracao pegou.
select pg_get_constraintdef(oid) as theme_valido
  from pg_constraint
 where conname = 'theme_valido'
   and conrelid = 'public.profiles'::regclass;
