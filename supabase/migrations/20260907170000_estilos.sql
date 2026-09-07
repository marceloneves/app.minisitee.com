update public.profiles set theme = 'areia' where theme = 'color';

alter table public.profiles drop constraint theme_valido;
alter table public.profiles add constraint theme_valido
  check (theme in ('light','dark','areia','menta','oceano','rosa'));
