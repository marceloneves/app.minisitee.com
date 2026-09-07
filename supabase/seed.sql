-- Cria o profile de marcelomneves@gmail.com, pulando /painel/comecar.
-- Rode DEPOIS do primeiro login (o usuario precisa existir em auth.users).
insert into public.profiles (id, username, display_name, headline, city, whatsapp)
select id, 'marcelo', 'Marcelo Neves', null, 'Florianópolis', '5548999998888'
from auth.users
where email = 'marcelomneves@gmail.com'
on conflict (id) do nothing;

select p.username, p.display_name, p.city, p.whatsapp
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'marcelomneves@gmail.com';
