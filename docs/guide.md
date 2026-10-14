# Guía de Uso

Cómo trabajar en este proyecto de **Spec Driven Development (SDD)**: desde una idea hasta el Release. Para el detalle completo de principios, arquitectura y roles, ver el índice en [`README.md`](../README.md); esta guía es el punto de entrada práctico.

## 1. Requisito previo: conectar Jira

Jira es la fuente de verdad para el trabajo operativo. Antes de usar el flujo, verifica la conexión:

```text
/setup-connections
```

Esto invoca al agente `connector`, que auto-detecta el proyecto (tabla **Proyectos** de [`docs/readme/proyectos.md`](./readme/proyectos.md)) y guía paso a paso si falta autorizar el MCP de Atlassian.

## 2. Acceso a bases de datos (opcional)

Si necesitas consultar Postgres (`dev`/`qa`/`prod`), configura las credenciales en [`mcp-postgres.config.json`](../mcp-postgres.config.json) y usa:

```text
/db <dev|qa|prod> <consulta>
```

Si omites el entorno, Claude te preguntará cuál usar antes de consultar nada. Guía completa: [`docs/integraciones/database-access.md`](./integraciones/database-access.md).

## 3. Flujo de trabajo, paso a paso

No existe un agente coordinador: cada comando se invoca manualmente, en este orden.

| Paso | Comando | Agente | Qué hace |
| --- | --- | --- | --- |
| 1 | `/create-spec "<idea>"` | `product-owner` | Convierte una idea en `requirements.md` (Objetivo, Alcance, Requisitos, Casos de Uso, Criterios de Aceptación). |
| 2 | `/create-jira <slug>` | `tech-lead` | Genera `design.md` **solo si la funcionalidad lo amerita**, y descompone el trabajo en Epic, Stories, Tasks y Subtasks. |
| 3 | `/implement <TASK-Número>` | `developer` | Implementa la Task en `src/`, escribe tests en `tests/` y abre un Pull Request. |
| 4 | — (manual) | — | Aprobar y mergear el Pull Request. |
| 5 | — (manual) | — | Actualizar README/docs/changelog del proyecto correspondiente reflejando el cambio aprobado. |
| 6 | `/release <correlativo>` | — (manual) | Verifica la Definition of Done de todas las Tasks del ciclo y libera a producción. |

## 4. Agentes disponibles

| Agente | Rol |
| --- | --- |
| `product-owner` | Idea → Requirements |
| `tech-lead` | Requirements → Design (si aplica) + Epic/Stories/Tasks/Subtasks |
| `developer` | Task de Jira → Código + Tests |
| `connector` | Verifica y guía la conexión con Jira |
| `pase-produccion` | Tickets del pase → CDA + ramas + versiones + PRs (orquesta el pase a producción) |

## 5. Estructura relevante del repositorio

```text
.mcp.json                   # servidores MCP (atlassian, postgres)
mcp-postgres.config.json    # credenciales de conexión por entorno (dev/qa/prod)

specs/
    templates/              # plantillas de Epic, Story, Task, Subtask
    workflow.md             # etapas, responsables y criterios de salida
    jira-workflow.md        # estados del ticket (Backlog → ... → Done)
    naming-conventions.md   # formato de nombres (EPIC-, US-, TASK-, SUB-)

docs/
    guide.md                # esta guía
    readme/                 # secciones del índice de README.md
    integraciones/          # database-access.md
    convenciones/           # architecture.md, coding-standards.md, api-guidelines.md,
                             # branching-strategy.md, glossary.md

```

## 6. Convenciones a seguir

- Nombres de ramas y artefactos: `specs/naming-conventions.md`.
- Commits: Conventional Commits, referenciando siempre el `TASK-<Número>` (`docs/convenciones/branching-strategy.md`).
- Ninguna funcionalidad se implementa sin Criterios de Aceptación (Given/When/Then).
- Ningún agente aprueba ni mergea su propio Pull Request: la aprobación y el merge son manuales.
- Ningún agente asume el entorno de base de datos (`dev`/`qa`/`prod`): si no está explícito, debe preguntar (`docs/integraciones/database-access.md`).

## 7. Dónde profundizar

- **Índice completo (principios, arquitectura, roles, etc.):** [`README.md`](../README.md).
- **Acceso a bases de datos:** [`docs/integraciones/database-access.md`](./integraciones/database-access.md).
