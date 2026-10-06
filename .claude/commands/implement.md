---
description: Implementa una Task de Jira en código y tests, invocando al agente developer.
argument-hint: <TASK-Número>
---

# /implement

## Entrada

`$ARGUMENTS` — el `TASK-<Número>` a implementar.

## Proceso

1. Leer la Task indicada y su Story/Epic/Design de origen.
2. Invocar el subagente `developer` (tool Task) con esa Task como entrada.
3. El agente implementa el alcance exacto en `src/`, escribe tests en `tests/` y abre Pull Request hacia `release/qa-<país>-<correlativo>` (ver `.claude/agents/developer.md` y `docs/convenciones/branching-strategy.md`).
4. La Task permanece en `In Progress` en `specs/jira-workflow.md` hasta que el Pull Request se apruebe y mergee (manual).

## Salida

Código + Tests, Pull Request abierto.

## Siguiente paso

Aprobar y mergear el Pull Request (manual); luego mover la Task a `Done` en `specs/jira-workflow.md`.
