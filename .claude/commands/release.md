---
description: Consolida y libera un Release, verificando manualmente la Definition of Done completa.
argument-hint: [correlativo de release]
---

# /release

## Entrada

`$ARGUMENTS` — correlativo de release.

## Proceso

1. Verificar manualmente que todas las Tasks incluidas están en `Done` (`specs/jira-workflow.md`) y cumplen la Definition of Done completa (ver [`docs/readme/definition-of-done.md`](../../docs/readme/definition-of-done.md)).
2. Confirmar que la documentación relevante (README, `doc/IA/architecture.md`, `doc/IA/api-guidelines.md` del proyecto correspondiente, changelog) fue actualizada para reflejar los cambios del ciclo.
3. Crear/consolidar la rama `release/<correlativo>` (ver `docs/convenciones/branching-strategy.md`), con merge commit de cada `feature/*` aprobada.
4. Mergear `release/<correlativo>` → la rama principal del repositorio (`principal-branch` en el `.code-workspace` del proyecto — ver `docs/convenciones/branching-strategy.md`).

## Salida

Release liberado a producción.
