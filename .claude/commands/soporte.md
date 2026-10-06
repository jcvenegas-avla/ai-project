---
description: Diagnostica una incidencia de soporte buscando en Jira Soporte y el código, y propone un plan de solución con borrador de ticket SPDI, invocando al agente soporte.
argument-hint: "<descripción de la incidencia>"
---

# /soporte

## Entrada

`$ARGUMENTS` — descripción de la incidencia reportada.

## Proceso

1. Invocar el subagente `soporte` (tool Agent, `subagent_type: soporte`) pasando `$ARGUMENTS` como descripción de la incidencia.
2. El agente busca en Jira Soporte (`SPDI`) tickets iguales o relacionados, investiga la causa en Jira y el Workspace, y arma un plan de solución + borrador de ticket (ver `.claude/agents/soporte.md`).

## Salida

Plan de solución a la incidencia, tickets relacionados (si existen) y borrador del ticket SPDI, con la opción de crearlo en Jira.

## Cuándo usarlo

- Ante cualquier incidencia o reporte de soporte del proyecto, en cualquier momento — es independiente del pipeline Idea→Release.
