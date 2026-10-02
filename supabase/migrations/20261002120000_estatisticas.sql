-- Estatisticas do minisitee: visitas e cliques por ferramenta.
--
-- A tabela events existe desde o init, mas nada gravava nela. Agora quem grava
-- e so a rota /api/visita, com a chave de servico: a policy antiga deixava
-- qualquer visitante inserir evento em nome de qualquer perfil.

alter table public.events
  add column if not exists visitante text,
  add column if not exists origem    text,
  add column if not exists aparelho  text,
  add column if not exists regiao    text;

-- visitante: hash do IP e do navegador com o dia e o perfil. Conta a mesma
-- pessoa uma vez por dia sem cookie e sem guardar o IP; no dia seguinte o hash
-- muda, e nao da para seguir ninguem entre dias nem entre minisites.

alter table public.events drop constraint if exists event_type_valido;
alter table public.events add constraint event_type_valido
  check (type in ('page_view', 'click', 'item_view', 'whatsapp_click'));

create index if not exists events_profile_tipo_idx
  on public.events (profile_id, type, created_at desc);
create index if not exists events_visitante_idx
  on public.events (profile_id, visitante, created_at desc);

drop policy if exists "events_insere_alvo_valido" on public.events;
revoke insert, update, delete, truncate on public.events from anon, authenticated;

-- Tudo o que a tela de estatisticas mostra, numa ida so. Conta do dono logado:
-- auth.uid() dentro da funcao, nao parametro. Dias no fuso de Brasilia, como
-- a agenda.
create or replace function public.estatisticas_minisite(p_dias int)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  with
  par as (
    select auth.uid() as dono,
           greatest(1, least(coalesce(p_dias, 30), 365)) as dias,
           (now() at time zone 'America/Sao_Paulo')::date as hoje
  ),
  lim as (
    select dono, dias, hoje,
           ((hoje - dias + 1)::timestamp at time zone 'America/Sao_Paulo') as inicio,
           ((hoje - 2 * dias + 1)::timestamp at time zone 'America/Sao_Paulo') as inicio_antes
    from par
  ),
  ev as (
    select e.*, (e.created_at at time zone 'America/Sao_Paulo') as local,
           e.created_at >= lim.inicio as atual
    from events e, lim
    where e.profile_id = lim.dono and e.created_at >= lim.inicio_antes
  ),
  cur as (select * from ev where atual),
  vis as (select * from cur where type = 'page_view'),
  cli as (select * from cur where type = 'click')
  select json_build_object(
    'dias', (select dias from lim),
    'desde', (select min(created_at) from events where profile_id = (select dono from lim)),
    'visitas', (select count(*) from vis),
    'visitas_antes', (select count(*) from ev where not atual and type = 'page_view'),
    'visitantes', (select count(distinct visitante) from vis),
    'visitantes_antes', (select count(distinct visitante) from ev where not atual and type = 'page_view'),
    'cliques', (select count(*) from cli),
    'cliques_antes', (select count(*) from ev where not atual and type = 'click'),
    'por_dia', (
      select json_agg(json_build_object('dia', g.dt::date, 'visitas', coalesce(v.n, 0)) order by g.dt)
      from lim
      cross join generate_series(lim.hoje - lim.dias + 1, lim.hoje, interval '1 day') as g(dt)
      left join (select local::date as dia, count(*) as n from vis group by 1) v on v.dia = g.dt::date
    ),
    'por_hora', (
      select json_agg(coalesce(n, 0) order by h)
      from generate_series(0, 23) h
      left join (select extract(hour from local)::int as hora, count(*) as n from vis group by 1) v
        on v.hora = h
    ),
    'por_semana', (
      select json_agg(coalesce(n, 0) order by s)
      from generate_series(0, 6) s
      left join (select extract(dow from local)::int as dow, count(*) as n from vis group by 1) v
        on v.dow = s
    ),
    'ferramentas', coalesce((
      select json_agg(json_build_object('id', i.id, 'titulo', i.title, 'kind', i.kind, 'cliques', c.n)
                      order by c.n desc)
      from (select item_id, count(*) as n from cli where item_id is not null group by 1) c
      join items i on i.id = c.item_id
    ), '[]'::json),
    'origens', coalesce((
      select json_agg(json_build_object('nome', nome, 'n', n) order by n desc)
      from (select coalesce(origem, 'direto') as nome, count(*) as n from vis group by 1) o
    ), '[]'::json),
    'aparelhos', coalesce((
      select json_agg(json_build_object('nome', nome, 'n', n) order by n desc)
      from (select coalesce(aparelho, 'computador') as nome, count(*) as n from vis group by 1) a
    ), '[]'::json),
    'regioes', coalesce((
      select json_agg(json_build_object('nome', nome, 'n', n) order by n desc)
      from (select regiao as nome, count(*) as n from vis where regiao is not null
            group by 1 order by 2 desc limit 10) r
    ), '[]'::json),
    'agendamentos', (
      select count(*) from agendamentos a, lim
      where a.profile_id = lim.dono and a.created_at >= lim.inicio
    ),
    'respostas', (
      select count(*) from respostas_formulario r, lim
      where r.profile_id = lim.dono and r.created_at >= lim.inicio
    )
  );
$$;

revoke execute on function public.estatisticas_minisite(int) from public, anon;
grant execute on function public.estatisticas_minisite(int) to authenticated;
