alter table public.items drop constraint kind_valido;
alter table public.items add constraint kind_valido check (
  kind in ('produto','whatsapp','link','redes','horario','endereco','telefone',
           'arquivo','faq','galeria','contagem')
);
