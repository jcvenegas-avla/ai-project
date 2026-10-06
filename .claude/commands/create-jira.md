---
description: Genera Design (cuando sea necesario) y Epic, Stories, Tasks y Subtasks a partir de un requirements.md aprobado, invocando al agente tech-lead.
argument-hint: [slug de la funcionalidad o ruta a requirements.md]
---

# /create-jira

## Entrada

`$ARGUMENTS` — slug de la funcionalidad (`specs/<slug-funcionalidad>/requirements.md`) o ruta directa al `requirements.md`.

## Proceso

1. Leer el `requirements.md` indicado.
2. Invocar el subagente `tech-lead` (tool Task) con ese `requirements.md` como entrada.
3. El agente decide si la funcionalidad requiere `design.md` (ver `.claude/agents/tech-lead.md`, sección "¿Cuándo generar design.md?") y, si aplica, lo produce alineado con `doc/IA/architecture.md`, `doc/IA/coding-standards.md` y `doc/IA/api-guidelines.md` del proyecto correspondiente (ver [`docs/readme/proyectos.md`](../../docs/readme/proyectos.md)).
4. El agente descompone la funcionalidad en un Epic y Stories independientes (siempre), siguiendo `specs/naming-conventions.md`. Para cada Story, pregunta explícitamente si hace falta desglosarla en Tasks (< 1 día) y Subtasks — si no hace falta, la Story queda como una única Task.
5. Guardar los artefactos en `specs/<slug-funcionalidad>/` (`design.md` si se generó, y `jira/` con Epic/Story/Task/Subtask) hasta que exista integración real con Jira (ver `specs/jira-workflow.md`).

## Salida

Backlog completo: `design.md` (si aplicó) + Epic, Stories, Tasks y Subtasks en estado `Backlog`.

## Siguiente paso

Priorizar (`Selected`) y ejecutar `/implement` por cada Task.
