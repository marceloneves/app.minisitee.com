-- "Meus agendamentos": o visitante confirma o e-mail com um codigo e passa a
-- ver, remarcar e cancelar os proprios agendamentos.
alter table public.agendamentos add column if not exists email text;
alter table public.agendamentos drop constraint if exists agendamento_email;
alter table public.agendamentos add constraint agendamento_email
  check (email is null or (char_length(email) <= 254 and email = lower(email)));
create index if not exists agendamentos_item_email_idx
  on public.agendamentos (item_id, email);

-- Guarda so o hash do codigo: quem ler a tabela nao consegue entrar com ele.
create table if not exists public.agenda_codigos (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items(id) on delete cascade,
  email        text not null,
  codigo_hash  text not null,
  tentativas   int not null default 0,
  usado        boolean not null default false,
  expira_em    timestamptz not null,
  created_at   timestamptz not null default now()
);
create index if not exists agenda_codigos_busca_idx
  on public.agenda_codigos (item_id, email, created_at desc);

-- Sem policy nenhuma: so a rota do servidor, com a chave de servico, le e grava.
alter table public.agenda_codigos enable row level security;
