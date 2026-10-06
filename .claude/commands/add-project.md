---
description: Agrega un nuevo proyecto al framework SDD (Workspace, Jira, Jira Soporte, Schemas Postgres), invocando al agente add-project.
argument-hint: "[opcional: descripción inicial del proyecto]"
---

# /add-project

Registra un proyecto nuevo en el framework SDD para que el resto de agentes (`product-owner`, `tech-lead`, `developer`, `soporte`, `connector`) puedan operar sobre él.

## Entrada

`$ARGUMENTS` — opcional: descripción inicial del proyecto (nombre, repos, Jira, etc.). Si viene vacío o incompleto, el agente `add-project` pregunta explícitamente los datos que falten.

## Proceso

1. Invocar el subagente `add-project` (tool Agent, `subagent_type: add-project`) pasando `$ARGUMENTS` como contexto inicial.
2. El agente recopila la información faltante, valida que el proyecto no exista ya, y agrega las entradas correspondientes en `docs/readme/proyectos.md` y el `.code-workspace` (ver `.claude/agents/add-project.md`).

## Salida

Confirmación de cada dato agregado junto a su ubicación exacta (archivo + tabla/sección), y los siguientes pasos sugeridos (`/setup-connections`, clonar repos).

## Cuándo usarlo

- Al incorporar un proyecto nuevo al framework SDD, antes de poder ejecutar `/create-spec`, `/create-jira`, `/implement`, `/soporte` o `/db` sobre él.
