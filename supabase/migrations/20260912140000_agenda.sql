-- Tipo agenda: o visitante escolhe dia e horario no minisite e pede um
-- agendamento; o dono confirma ou cancela no painel.
alter table public.items drop constraint kind_valido;
alter table public.items add constraint kind_valido check (
  kind in ('produto','whatsapp','link','redes','horario','endereco','telefone',
           'arquivo','faq','galeria','contagem','qrcode','agenda')
);

-- Uma agenda por minisite. Quem garante e o indice; a action so traduz o erro.
create unique index if not exists items_uma_agenda
  on public.items (profile_id) where kind = 'agenda';

-- dia + hora sao a hora local do negocio, sem fuso: quem agenda e quem atende
-- estao quase sempre na mesma cidade.
create table if not exists public.agendamentos (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  dia         date not null,
  hora        time not null,
  nome        text not null,
  telefone    text not null,
  observacao  text,
  status      text not null default 'pendente',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint agendamento_status_valido check (status in ('pendente','confirmado','cancelado')),
  constraint agendamento_nome check (char_length(nome) between 1 and 80),
  constraint agendamento_telefone check (telefone ~ '^[0-9]{10,15}$'),
  constraint agendamento_observacao check (observacao is null or char_length(observacao) <= 500)
);

-- Dois pedidos para o mesmo horario: o segundo esbarra aqui, mesmo chegando
-- no mesmo instante. Cancelar libera o horario de novo.
create unique index if not exists agendamentos_horario_unico
  on public.agendamentos (item_id, dia, hora) where status <> 'cancelado';
create index if not exists agendamentos_profile_dia_idx
  on public.agendamentos (profile_id, dia);

drop trigger if exists trg_agendamentos_updated on public.agendamentos;
create trigger trg_agendamentos_updated
  before update on public.agendamentos
  for each row execute function public.touch_updated_at();

alter table public.agendamentos enable row level security;

-- Sem policy de insert: o pedido do visitante passa pela rota /api/agenda,
-- que confere se o horario existe e esta livre antes de gravar.
drop policy if exists "agendamentos_dono_le" on public.agendamentos;
create policy "agendamentos_dono_le" on public.agendamentos
  for select using (auth.uid() = profile_id);
drop policy if exists "agendamentos_dono_atualiza" on public.agendamentos;
create policy "agendamentos_dono_atualiza" on public.agendamentos
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
drop policy if exists "agendamentos_dono_apaga" on public.agendamentos;
create policy "agendamentos_dono_apaga" on public.agendamentos
  for delete using (auth.uid() = profile_id);
