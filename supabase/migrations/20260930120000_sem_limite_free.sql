-- O plano free deixa de ter limite de ferramentas. Sai o trigger que barrava o
-- insert alem de 5 itens (20260911221500_limite_free_5.sql) e a funcao dele.
drop trigger if exists trg_limite_itens on public.items;
drop function if exists public.checar_limite_itens();
