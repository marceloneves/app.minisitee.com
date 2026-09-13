-- Produto tambem fica so com Rascunho e Ativo, como as outras ferramentas.
-- Reservado continuava publicado, entao vira ativo; encerrado estava fora do
-- ar, entao vira rascunho.
update public.items set status = 'ativo' where status = 'reservado';
update public.items set status = 'rascunho' where status = 'encerrado';

alter table public.items drop constraint if exists status_da_ferramenta;
alter table public.items add constraint status_da_ferramenta
  check (status in ('rascunho','ativo'));
