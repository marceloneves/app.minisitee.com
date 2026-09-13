-- Tipo novo: QR code apontando para um link. O endereco mora em items.url,
-- a mesma coluna do tipo link, e segue a mesma regra de ter http(s).
alter table public.items drop constraint kind_valido;
alter table public.items add constraint kind_valido check (
  kind in ('produto','whatsapp','link','redes','horario','endereco','telefone',
           'arquivo','faq','galeria','contagem','qrcode')
);

alter table public.items drop constraint if exists url_obrigatoria_para_qrcode;
alter table public.items add constraint url_obrigatoria_para_qrcode
  check (kind <> 'qrcode' or (url is not null and url ~ '^https?://'));
