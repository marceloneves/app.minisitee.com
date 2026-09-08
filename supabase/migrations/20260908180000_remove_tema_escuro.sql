update public.profiles set theme = 'light' where theme = 'dark';

alter table public.profiles drop constraint theme_valido;
alter table public.profiles add constraint theme_valido
  check (theme in ('light','areia','menta','oceano','rosa'));
