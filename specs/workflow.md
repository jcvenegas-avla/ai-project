# Workflow

Idea

↓

Requirements

↓

Epic / Stories (Tasks y Subtasks, si corresponde) (Design incluido, si es necesario)

↓

Implementation

↓

Release (Documentation manual)

---

# Etapas, Responsables y Criterios de Salida

| Etapa | Agente responsable | Comando | Entrada | Salida | Criterio de salida (gate) |
| --- | --- | --- | --- | --- | --- |
| Requirements | `product-owner` | `/create-spec` | Idea | `requirements.md` | Completa Objetivo, Alcance, Requisitos Funcionales/No Funcionales, Casos de Uso y Criterios de Aceptación |
| Epic / Stories / Tasks / Subtasks | `tech-lead` | `/create-jira` | `requirements.md` | `design.md` (si aplica) + Backlog (Epic y Stories siempre; Tasks/Subtasks solo si corresponde — ver nota abajo) | Design, si se generó, sigue la estructura de `.claude/agents/tech-lead.md` y los estándares de `doc/IA/architecture.md`, `doc/IA/coding-standards.md`, `doc/IA/api-guidelines.md` del proyecto correspondiente; nombres válidos según `specs/naming-conventions.md`; Stories independientes; se preguntó explícitamente por cada Story si requiere desglose en Tasks/Subtasks; Tasks implementables en menos de un día |
| Implementation | `developer` | `/implement` | Task de Jira | Código + Tests | Implementa exactamente el alcance de la Task, incluye tests, Pull Request abierto y mergeado |
| Release | manual | `/release` | Todas las Tasks del ciclo en `Done` | Release liberado | Documentación actualizada manualmente y Definition of Done completa (ver [`docs/readme/definition-of-done.md`](../docs/readme/definition-of-done.md)) |

La coordinación del pipeline y la actualización de documentación quedan fuera del framework de agentes: cada comando se invoca manualmente en el orden de la tabla anterior. Ninguna etapa automatizada puede saltarse ni ejecutarse fuera de orden.

## Granularidad del backlog: Epic → Story → (Task / Subtask opcional)

`tech-lead` siempre genera el Epic y las Stories (`US-<Número>`) a partir de `requirements.md`. Para cada Story, debe **preguntar explícitamente** al usuario si es necesario desglosarla en Tasks (y, dentro de estas, en Subtasks) — nunca decidirlo por su cuenta ni asumir un desglose que no se confirmó.

- **Si se indica que sí es necesario:** desglosar la Story en una o más Tasks (`TASK-<Número>`, cada una implementable en menos de un día) y, si corresponde, cada Task en Subtasks (`SUB-<Número>`).
- **Si se indica que no es necesario:** la Story queda registrada como una única Task (`TASK-<Número>`), sin Subtasks — el pipeline sigue funcionando igual, ya que `/implement` siempre toma una Task de Jira como entrada, nunca una Story directamente.
