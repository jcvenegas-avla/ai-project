---
name: validacion-pase
description: Ejecuta la validación final de un pase de producción — Proyecto, Git, Versiones y Jira — comprobando cada punto contra las herramientas (no contra lo que el agente cree haber hecho) y devuelve un checklist ✅/⚠️/❌. La usa el agente pase-produccion; no se invoca sola.
user-invocable: false
---

# Skill: validacion-pase

## Objetivo

Confirmar, con evidencia de las herramientas, que el pase quedó completo y coherente antes de informar el resultado. No corrige nada: reporta.

## Cuándo se utiliza

En el paso **Validar** del agente `pase-produccion`, después de crear el PR de pase. También puede reejecutarse si el usuario lo pide sobre un pase existente.

## Inputs

Resultados de las skills `git-pase`, `versiones`, `jira-cda` y `descripcion-cda`, más las reglas del proyecto (`docs/readme/proyectos.md`, `docs/readme/agente-de-pases-de-produccion.md`, `doc/IA/pase-produccion.md`).

## Outputs

Checklist por sección, cada ítem con estado (`✅` / `⚠️` pendiente de terceros / `❌` falla) y la evidencia (comando o tool usada y resultado).

## Reglas

1. Cada ítem se verifica **releyendo** el estado real (git remoto, API de PRs, `getJiraIssue`), no a partir de la memoria del flujo.
2. `⚠️` solo para lo que depende de otras personas (PRs de integración aún sin mergear, aprobaciones, y la rama release y el PR de pase que tiene que crear a mano la persona correspondiente cuando no hubo permiso). Todo lo demás es `✅` o `❌`.
3. Con algún `❌`, el agente **no** debe informar el pase como completo.

## Checklist

### Proyecto
- `docs/readme/proyectos.md` y `docs/readme/agente-de-pases-de-produccion.md` leídos y proyecto identificado en la tabla *Proyectos*.
- `doc/IA` leído; reglas del pase identificadas (archivo y secciones usadas).

### Git (por repositorio — skill `git-pase`)
- `feature/CDA-XXXXX` existe en el remoto.
- Contiene la rama productiva actual (`merge-base --is-ancestor`).
- PRs de integración creados, con head `feature/<TICKET>` y base `feature/CDA-XXXXX`.
- `release/CDA-XXXXX` existe en el remoto y contiene la rama productiva. Si no hubo permiso y todavía no la creó la persona correspondiente → ⚠️ (acción manual), con el mensaje del remoto.
- PR `feature/CDA-XXXXX` → `release/CDA-XXXXX` creado (o ⚠️ si la release aún no existe).
- PR de pase creado, con head `release/CDA-XXXXX` y base = rama productiva correcta. Si es manual: la URL que pegó el usuario se verificó con el host; si aún no existe → ⚠️ (acción manual).

### Versiones (skill `versiones`)
- Versión anterior = versión de la rama productiva.
- Versión nueva = regla de Release/Hotfix aplicada a la anterior.
- `version-tag` ejecutado: archivo actualizado en `origin/feature/CDA-XXXXX` y tag en el remoto, verificado con `git ls-remote --tags origin <tag>` (que exista en local no alcanza).
- Repos sin versión (Liquibase) con `-` en Versión y Rollback.

### Jira (skill `jira-cda`)
- CDA creado; `summary` con el número real y el formato correcto.
- Campos con los valores esperados (defaults o los indicados por el usuario).
- Layers = los confirmados por el usuario.
- Fecha/hora de inicio y fin correctas.
- Descripción: 3 tablas, links de tickets y PRs válidos, Deploy igual a las reglas, sin `pendiente`.
- Devs y QAs correctos (menciones con `accountId`).
- Cada ticket compartido por el usuario vinculado al CDA ("Vincular actividad") con el tipo de link del proyecto y en la dirección correcta: en los `issuelinks` del CDA el ticket figura como `inwardIssue` ("ticket connects to CDA"). Como `outwardIssue` = invertido → ❌.
- Modo Editar: se trabajó sobre el CDA indicado y no se creó ninguno nuevo (JQL por `summary` en el proyecto CDA).

## Errores

Si una verificación no puede ejecutarse (sin conexión, sin permisos), el ítem queda `❌` con el motivo; nunca se marca `✅` por suposición.

## Ejemplo

```text
Git — artico-frontend
  ✅ feature/CDA-14643 en origin (git ls-remote)
  ✅ contiene origin/main-mx
  ⚠️ PR #2520 feature/AMPMX-326 → feature/CDA-14643: abierto, pendiente de aprobación
  ✅ release/CDA-14643 en origin, contiene origin/main-mx
  ✅ PR #2523 feature/CDA-14643 → release/CDA-14643
  ✅ PR #2524 release/CDA-14643 → main-mx (PR de pase)
Git — api-artico (sin permiso para release/*)
  ⚠️ release/CDA-14643: push rechazado (protected branch). Pendiente: la persona correspondiente crea la rama y el PR release/CDA-14643 → master-mx
Versiones — artico-frontend
  ✅ 1.81.1 → 1.82.0 (Release), tag 1.82.0 en origin
```
