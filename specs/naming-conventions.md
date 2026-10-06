# Naming

Epic

EPIC-<Producto>

Story

US-<Número>

Task

TASK-<Número>

Subtask

SUB-<Número>

---

## Reglas de formato

- `<Producto>` va en kebab-case, minúsculas y sin acentos — nombre corto de la funcionalidad o producto (ej. `EPIC-facturacion-electronica`).
- `<Número>` es secuencial, único y no se reutiliza dentro del proyecto. Lo asigna el `tech-lead` (`.claude/agents/tech-lead.md`) al crear cada Story, Task o Subtask.

## Carpetas de Specs

Cada funcionalidad vive en `specs/<slug-funcionalidad>/`, donde `<slug-funcionalidad>` es igual al `<Producto>` del Epic asociado:

```text
specs/<slug-funcionalidad>/
    requirements.md
    design.md
    decisions.md
    jira/
```

## Decisiones de Arquitectura (ADR)

- Un único `decisions.md` por funcionalidad si las decisiones son pocas (Contexto, Decisión, Alternativas Consideradas, Consecuencias, Estado).
- Si hay varias decisiones independientes, usar `ADR-<Número>-<slug-decision>.md` dentro de la misma carpeta.

## Git

Ver `docs/convenciones/branching-strategy.md` para el detalle completo del modelo, reglas de PR, merge y hotfix.

- Feature: `feature/<TASK-Número>-<slug-descriptivo>`, nace desde la rama principal del repositorio (`principal-branch` en el `.code-workspace` del proyecto, ver `docs/convenciones/branching-strategy.md`) — no siempre `main`.
- QA por país: `release/qa-<país>-<correlativo>` — `<país>` en ISO 3166-1 alpha-2 (ej. `cl`, `pe`, `mx`), obtenido de la fila "País" del proyecto en `docs/readme/proyectos.md`; `<correlativo>` secuencial de 3 dígitos por país.
- Release de producción: `release/<correlativo>` — `<correlativo>` secuencial global de release.
- Hotfix: `hotfix/<TASK-Número>-<slug-descriptivo>`, nace desde la rama principal del repositorio (mismo criterio que Feature).
- Commits: Conventional Commits referenciando el Task, ej. `feat(TASK-431): agregar validación de RUT`.
