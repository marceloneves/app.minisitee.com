-- Ferramentas (tudo que nao e produto) so tem dois status: rascunho e ativo.
-- Reservado continuava publicado, entao vira ativo; encerrado estava fora do
-- ar, entao vira rascunho.
update public.items set status = 'ativo'
  where kind <> 'produto' and status = 'reservado';
update public.items set status = 'rascunho'
  where kind <> 'produto' and status = 'encerrado';

alter table public.items drop constraint if exists status_da_ferramenta;
alter table public.items add constraint status_da_ferramenta
  check (kind = 'produto' or status in ('rascunho','ativo'));
