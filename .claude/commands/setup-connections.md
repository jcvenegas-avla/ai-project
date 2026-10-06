---
description: Verifica y deja lista la conexión del proyecto con Jira de forma guiada, invocando al agente connector.
argument-hint: "[opcional: nombre del proyecto]"
---

# /setup-connections

Onboarding de conexión en un paso: comprueba si Jira está accesible y, si falta, te guía para dejarlo listo — sin que necesites conocimiento técnico ni manejar tokens a mano.

## Entrada

`$ARGUMENTS` — opcional: el proyecto a configurar (por defecto, el único de la tabla **Proyectos** de `docs/readme/proyectos.md`, o el que corresponda al workspace abierto).

## Proceso

1. Invocar el subagente `connector` (tool Agent, `subagent_type: connector`) pasando `$ARGUMENTS` como proyecto objetivo.
2. El agente auto-detecta el contexto (tabla Proyectos), verifica la conexión y guía lo que falte (ver `.claude/agents/connector.md`).

## Salida

Un checklist de conexión (✅ / ⚠️ / ❌) y, si falta, la instrucción exacta para resolverlo.

## Cuándo usarlo

- La primera vez que alguien abre el proyecto (setup inicial).
- Cuando un agente de planificación (product-owner, tech-lead) reporte que no pudo consultar Jira.
