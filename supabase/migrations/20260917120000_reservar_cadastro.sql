-- /cadastro virou pagina do app: ninguem pode ter um minisite nesse endereco.
insert into public.reserved_usernames (name) values ('cadastro')
  on conflict do nothing;

-- Deve vir zero: um perfil ja criado com esse nome ficaria escondido pela pagina.
select count(*) as perfis_com_cadastro
  from public.profiles
 where username = 'cadastro';
