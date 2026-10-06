# Jira Workflow

Backlog

↓

Selected

↓

In Progress

↓

Done

> **Nota:** no existe un agente `orchestrator`: la transición entre estados se gestiona manualmente invocando cada comando en orden.

---

# Estados, Responsables y Criterios

| Estado | Agente responsable | Entra cuando... | Sale cuando... |
| --- | --- | --- | --- |
| Backlog | `tech-lead` | Se genera el ticket a partir de `requirements.md` (y `design.md`, si aplica) | Se prioriza para trabajarse |
| Selected | `tech-lead` / manual | Se prioriza el ticket | El `developer` toma la Task |
| In Progress | `developer` | El `developer` comienza la implementación | Se abre el Pull Request con código + tests y se mergea |
| Done | manual | Se mergea el PR | — (fin del ciclo para esa Task; documentación y `/release` se gestionan manualmente) |

Jira es la única fuente de verdad para estos estados (ver [`docs/readme/principios.md`](../docs/readme/principios.md)). Mientras no exista integración técnica real con Jira, los artefactos locales en `specs/<slug-funcionalidad>/jira/` reflejan este mismo flujo, pero deben sincronizarse y dejar de ser autoritativos en cuanto la integración exista.
