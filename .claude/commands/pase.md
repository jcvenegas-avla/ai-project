---
description: Gestiona un pase de producción con ticket CDA de Jira (ramas, versiones, PRs y descripción), invocando al agente pase-produccion.
argument-hint: "[editar CDA-XXXXX] <proyecto> <release|hotfix> <tickets> <fecha> <hora inicio>-<hora fin>"
---

# /pase

## Entrada

`$ARGUMENTS` — datos del pase que el usuario ya tenga: proyecto, tipo (Release/Hotfix), repositorios, tickets (`AMPMX-*`/`SPDI-*`, se vinculan al CDA), fecha, hora de inicio y fin, ramas de los tickets. Lo que falte lo pide el agente.

Si se menciona un CDA existente (ej. `editar CDA-15600`), el agente trabaja sobre ese ticket y **no crea uno nuevo**: toma sus datos como base y pide solo lo que falte.

## Proceso

1. Invocar el subagente `pase-produccion` (tool Agent, `subagent_type: pase-produccion`) pasando `$ARGUMENTS`.
2. Cada vez que el agente devuelva un bloque `⏸ Pase detenido`, hacerle al usuario **exactamente** esa pregunta (con AskUserQuestion cuando sean opciones cerradas, como los Layers) y continuar **el mismo agente** (SendMessage con su id) pasándole la respuesta literal. Las preguntas de información faltante van **de a una**: no agruparlas ni adelantar la siguiente antes de tener la respuesta. No responder por el usuario ni completar datos por cuenta propia.
3. La aprobación del plan (parada P2) debe ser explícita del usuario: sin ella no se continúa.
4. Si el agente devuelve `⏸ Pase detenido — Acción manual: rama release`, mostrarle al usuario el aviso tal cual: no hubo permiso para crear `release/CDA-XXXXX`, y tiene que pedirle a la persona correspondiente que cree la rama y el PR de pase a mano. Después preguntarle si espera para pegar la URL del PR o si el agente sigue con el resto del pase, y retomar el agente con la respuesta. No intentar crear la rama por otra vía.
5. Al terminar, mostrar al usuario el resultado y el checklist de validación que devolvió el agente.

## Salida

CDA creado y configurado, ramas `feature/CDA-XXXXX` y `release/CDA-XXXXX` (o el aviso para crear la release a mano), versiones aplicadas, PRs de integración y de pase, y checklist de validación (ver `.claude/agents/pase-produccion.md`).

## Cuándo usarlo

- Para preparar un pase a producción (Release o Hotfix) de un proyecto de la tabla *Proyectos* que tenga reglas de pase declaradas (ver `docs/readme/agente-de-pases-de-produccion.md`, *Reglas de Pase por Proyecto*).
