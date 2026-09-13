# Log de mudanças

Um arquivo por dia, `AAAA-MM-DD.md`, com o que mudou no app naquele dia.

O git guarda o código; este log guarda o que o git não mostra sozinho: por que
a mudança foi feita, o que foi aplicado no banco de produção, o que foi
conferido depois do deploy e o que ficou pendente.

## Como escrever

- Um arquivo por dia de trabalho. Se já existe, acrescente no fim.
- O arquivo do log entra no mesmo commit da mudança.
- Cada mudança tem título, commit e o que muda para quem usa.
- Para o usuário, o que o código chama de item é **ferramenta**.

## Modelo

```markdown
# AAAA-MM-DD

## Resumo

Uma ou duas frases sobre o dia.

## Mudanças

### Título da mudança — `abc1234`

- O que muda para o dono do minisite ou para o visitante
- Detalhe técnico que importa para quem mexer depois

## Banco

- `supabase/migrations/arquivo.sql`: o que faz; se já foi aplicada em produção

## Pendências

- O que ficou para depois
```
