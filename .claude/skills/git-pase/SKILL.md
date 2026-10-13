---
name: git-pase
description: Gestiona la parte Git de un pase de producción — localiza las ramas de los tickets, crea y mantiene actualizada la rama feature/CDA-XXXXX desde la rama productiva, intenta crear la rama release/CDA-XXXXX (si no hay permiso, pide que la cree a mano la persona correspondiente), y crea los PRs de integración (ticket → feature/CDA, feature/CDA → release/CDA) y de pase (release/CDA → productiva) en GitHub o Bitbucket. La usa el agente pase-produccion; no se invoca sola.
user-invocable: false
---

# Skill: git-pase

## Objetivo

Ser la responsable de ramas y Pull Requests del pase, en cada repositorio incluido, respetando el flujo de ramas definido por el proyecto.

## Cuándo se utiliza

- **Analizar tickets:** localizar la rama y los PRs de cada ticket en cada repo.
- **Preparar ramas:** crear `feature/CDA-XXXXX` y actualizarla con producción (después de conocer el CDA real).
- **Crear la rama release:** intentar crear `release/CDA-XXXXX` desde la rama productiva; sin permiso, dejarlo como acción manual.
- **Crear PRs de integración** y **PR de pase**.
- **Validar Git** (skill `validacion-pase`).

## Inputs

| Input | Origen |
| --- | --- |
| Repositorios: ruta local, host (`github`/`bitbucket`), `owner/repo`, rama productiva | Workspace del proyecto + `doc/IA/pase-produccion.md` (Recursos / Ramas) |
| Flujo de ramas del pase | `doc/IA/pase-produccion.md` (Ramas) |
| `CDA-XXXXX` | Skill `jira-cda` |
| Tickets y sus ramas | Usuario / búsqueda en los remotos |

## Outputs

Por repositorio: `{ rama_pase, base_commit, actualizada: sí/no, rama_release: { nombre, estado: creada | reutilizada | manual_pendiente, error }, prs_integracion: [{ticket, url, numero, estado, autor}], pr_cda_release: {url, numero}, pr_pase: {url, numero, origen: agente | manual} }`.

`rama_release.estado = manual_pendiente` significa que el agente no tuvo permiso para crear `release/CDA-XXXXX`: la tiene que crear la persona correspondiente, junto con el PR de pase (ver regla 10).

## Reglas

### Seguridad

1. Antes de tocar un repo: `git -C <repo> status --porcelain`. Si la salida no está vacía (cambios sin commitear **o archivos sin trackear**), **detenerse** y preguntar: no hacer stash, borrar ni descartar nada por cuenta propia. Los archivos sin trackear también cuentan porque `version-tag` hace `git add .` y los incluiría en el commit de versión.
2. Nunca: `push --force`, `reset --hard` sobre ramas remotas, rebase de ramas compartidas, commits directos sobre la rama productiva, ni merge de PRs (los aprueban y mergean personas).
3. Crear ramas, hacer push y crear PRs solo si el usuario ya aprobó el plan que los incluye.

### Ramas de los tickets

4. Si el usuario no indicó la rama de un ticket, buscarla en cada repo: `git ls-remote --heads origin "*<TICKET>*"`. Una coincidencia → usarla; varias → preguntar; ninguna → el ticket no tiene cambios en ese repo (confirmarlo si el ticket debería tenerlos).
5. Autor de la rama/PR: GitHub `gh pr list -R <owner/repo> --head <rama> --state all --json number,url,author,state`; Bitbucket vía API (ver 13). Sirve a `descripcion-cda` para la columna Dev.

### Rama del pase

6. `git -C <repo> fetch origin`. Crear la rama del pase **desde la rama productiva remota** y publicarla:
   ```bash
   git -C <repo> switch -c feature/CDA-XXXXX origin/<rama-productiva>
   git -C <repo> push -u origin feature/CDA-XXXXX
   ```
   Si la rama ya existe en el remoto, no recrearla: hacer checkout y verificar que salga de la productiva.
7. **Actualizada con producción:** `git -C <repo> merge-base --is-ancestor origin/<rama-productiva> feature/CDA-XXXXX`. Si no lo está: `git merge --no-ff origin/<rama-productiva>` + push. Con conflictos: `git merge --abort` y detenerse. Verificarlo de nuevo antes de crear el PR de pase.

### Rama release (PR de pase)

8. **Intentar crear `release/CDA-XXXXX`** en cada repo, desde la rama productiva remota, **sin cambiar la rama local** (sigue activa `feature/CDA-XXXXX`, que es donde corre `version-tag`):
   ```bash
   git -C <repo> fetch origin
   git -C <repo> ls-remote --heads origin release/CDA-XXXXX                       # ¿ya existe?
   git -C <repo> push origin origin/<rama-productiva>:refs/heads/release/CDA-XXXXX
   ```
   - **Ya existe** (típico en modo Editar): no recrearla. Verificar que contenga la productiva (`merge-base --is-ancestor origin/<rama-productiva> origin/release/CDA-XXXXX`). Si no la contiene, informarlo como ⚠️: el agente **no** mergea sobre `release/*`.
   - **Push aceptado:** `rama_release.estado = creada`. Verificar con `ls-remote` que exista.
   - **Push rechazado por permisos** (ver regla 9): `rama_release.estado = manual_pendiente` y seguir la regla 10. No reintentar ni buscar alternativas: no usar otra cuenta, no crear la rama con otro nombre ni volver a `feature/CDA-XXXXX → <rama-productiva>` como PR de pase.
   - **Cualquier otro error** (red, la rama productiva no existe, etc.): detenerse (P3) con el comando y la salida.
9. **Qué cuenta como falta de permiso:** el remoto rechaza el push con mensajes como `403`, `Permission denied`, `permission to <repo> denied`, `protected branch`, `pre-receive hook declined`, `You are not allowed to push`, `GH006`/`GH013` (reglas de rama en GitHub) o una restricción de rama de Bitbucket. Ante la duda, tratarlo como falta de permiso, guardar el mensaje exacto en `rama_release.error` y no reintentar.
10. **Sin permiso → acción manual.** El agente no crea la rama ni el PR de pase. Termina su turno con un bloque `⏸ Pase detenido — Acción manual: rama release` que diga:
    - el repo y el mensaje de error del remoto;
    - que el usuario le pida a **la persona correspondiente** (quien tenga permisos sobre `release/*` en ese repo) que:
      1. cree `release/CDA-XXXXX` desde `<rama-productiva>`;
      2. cree el PR de pase `release/CDA-XXXXX → <rama-productiva>`, con título igual al summary del CDA y el link al CDA en el cuerpo;
    - que cuando esté hecho, el usuario pegue la URL del PR de pase. El agente la verifica (regla 14), crea él mismo el PR `feature/CDA-XXXXX → release/CDA-XXXXX` (regla 12) y completa la Tabla 1;
    - que si el usuario prefiere seguir sin esperar, el agente termina el resto del pase y deja el PR de pase como pendiente manual. En ese caso la Tabla 1 muestra `release/CDA-XXXXX` en *Rama* y `pendiente (manual)` en *Pull Request*, y la validación lo marca ⚠️. Cuando el PR exista, se completa en modo Editar.

### Pull Requests

11. **Integración de tickets** (uno por ticket y repo): `feature/<TICKET>` → `feature/CDA-XXXXX`. Título: `<TICKET> → CDA-XXXXX`. Cuerpo: link al ticket y al CDA. Si ya existe un PR abierto con el mismo head/base, reutilizarlo.
12. **Integración del CDA a la release** (uno por repo, cuando `release/CDA-XXXXX` existe): `feature/CDA-XXXXX` → `release/CDA-XXXXX`. Título: `CDA-XXXXX → release/CDA-XXXXX`. Cuerpo: link al CDA. Si ya existe uno abierto con el mismo head/base, reutilizarlo. Si GitHub o Bitbucket rechazan este PR por permisos, se suma a la acción manual de la regla 10.
13. **Pase** (uno por repo): `release/CDA-XXXXX` → `<rama-productiva>`. Título: el summary del CDA (ej. `Release Artico MP MX - [CDA-14643]`). Cuerpo: link al CDA. Lo crea el agente solo si la rama release quedó `creada` o `reutilizada`. Con `manual_pendiente`, el PR lo crea la persona correspondiente (regla 10). Antes de crearlo, verificar que `feature/CDA-XXXXX` siga actualizada con la productiva (regla 7).
14. **PR creado a mano:** antes de usar una URL que pegó el usuario, verificar con la herramienta del host que el PR exista y que su head sea `release/CDA-XXXXX` y su base `<rama-productiva>`. Si no coincide, informarlo y volver a pedirla. Se reporta con `pr_pase.origen = manual`.
15. Por host:
    - **GitHub:** `gh pr create -R <owner/repo> --base <base> --head <head> --title "<t>" --body "<b>"` → la URL la devuelve `gh`.
    - **Bitbucket:** API REST con las variables `BITBUCKET_USER` y `BITBUCKET_TOKEN` (API token o app password):
      ```bash
      curl -sS -u "$BITBUCKET_USER:$BITBUCKET_TOKEN" -H "Content-Type: application/json" \
        -X POST "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests" \
        -d '{"title":"<t>","source":{"branch":{"name":"<head>"}},"destination":{"branch":{"name":"<base>"}},"description":"<b>"}'
      ```
      La URL es `links.html.href` de la respuesta. **Sin credenciales:** no inventar el PR — dar al usuario el link de creación manual `https://bitbucket.org/<workspace>/<repo>/pull-requests/new?source=<head>&dest=<base>`, pedirle que pegue la URL resultante y verificarla antes de usarla.
16. Un PR solo se reporta como creado si la herramienta devolvió su URL/número.

## Validaciones

- `feature/CDA-XXXXX` existe en el remoto de cada repo (`git ls-remote --heads origin feature/CDA-XXXXX`).
- Contiene la rama productiva (regla 7).
- `release/CDA-XXXXX` existe en el remoto y contiene la rama productiva. Si quedó `manual_pendiente` y todavía no existe, se informa como ⚠️ pendiente de terceros.
- Cada PR tiene el head y base esperados (`gh pr view <n> --json headRefName,baseRefName,state,url` / `GET .../pullrequests/<id>`):
  - integración de tickets: `feature/<TICKET>` → `feature/CDA-XXXXX`;
  - integración del CDA: `feature/CDA-XXXXX` → `release/CDA-XXXXX`;
  - pase: `release/CDA-XXXXX` → `<rama-productiva>`.
- Estado de los PRs de integración: abiertos o mergeados (si alguno sigue abierto, informarlo como pendiente de aprobación).

## Errores (detienen el flujo)

| Situación | Qué informar |
| --- | --- |
| Repo con cambios sin commitear | Repo y archivos |
| Rama productiva no encontrada | Repo y rama esperada |
| No se puede crear o publicar `feature/CDA-XXXXX` | Comando y salida |
| Sin permiso para crear `release/CDA-XXXXX` | No es un error del pase: acción manual (regla 10), con el repo y el mensaje del remoto |
| `release/CDA-XXXXX` falla por otro motivo | Comando y salida (P3) |
| Conflictos al actualizar con producción | Archivos en conflicto; merge abortado |
| Falla la creación de un PR | Repo, head → base y error; qué PRs sí se crearon |
| URL de PR manual que no coincide | URL, head/base encontrados y esperados |
| Faltan credenciales de Bitbucket | Link de creación manual; esperar la URL del usuario |

## Ejemplo

```text
artico-frontend (GitHub avla-tech/artico-frontend, productiva main-mx)
  switch -c feature/CDA-14643 origin/main-mx → push -u
  PR feature/AMPMX-326 → feature/CDA-14643        #2520  (integración del ticket — Tabla 2)
  push origin/main-mx → release/CDA-14643         creada
  PR feature/CDA-14643 → release/CDA-14643        #2523  (integración del CDA)
  PR release/CDA-14643 → main-mx                  #2524  (PR de pase — Tabla 1)

Sin permiso para release/*:
  push origin/main-mx → release/CDA-14643         ✗ remote rejected (protected branch)
  ⏸ Acción manual: pedir a quien tenga permisos que cree release/CDA-14643
    desde main-mx y el PR release/CDA-14643 → main-mx; pegar la URL del PR.
```
