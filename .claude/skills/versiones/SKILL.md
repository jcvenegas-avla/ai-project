---
name: versiones
description: Calcula y aplica la nueva versión de cada repositorio de un pase de producción (Release o Hotfix), a partir de la versión de la rama productiva, y devuelve versión anterior (Rollback) y nueva. La usa el agente pase-produccion; no se invoca sola.
user-invocable: false
---

# Skill: versiones

## Objetivo

Ser la **única** responsable de las reglas de versionado de un pase: detectar si un repositorio maneja versión, leer la versión productiva, calcular la nueva según el tipo de pase, aplicarla con el comando del proyecto sobre la rama del pase y verificar el resultado.

## Cuándo se utiliza

En el paso **Gestionar versiones** del agente `pase-produccion`, una vez creada y actualizada la rama `feature/CDA-XXXXX` de cada repositorio (skill `git-pase`).

## Inputs

| Input | Origen |
| --- | --- |
| Tipo de pase (`Release` / `Hotfix`) | Usuario |
| Número de CDA (`CDA-XXXXX`) | Skill `jira-cda` (el real, devuelto por Jira) |
| Repositorios del pase | Reglas del proyecto (`doc/IA/pase-produccion.md`, sección Recursos / Versiones) |
| Por repositorio: maneja versión, archivo fuente, comando, rama productiva | Reglas del proyecto |

## Outputs

Por repositorio: `{ recurso, versiona: sí/no, version_anterior, version_nueva, tag, comando_ejecutado, resultado }`.
Para repositorios sin versión: `version_anterior = "-"`, `version_nueva = "-"`.

## Reglas

1. **Detección:** un repositorio maneja versión solo si las reglas del proyecto lo dicen. Si no hay reglas, deducirlo del repo (script `version-tag` en `package.json`, versión en `pom.xml`/`package.json`) y **confirmarlo con el usuario** antes de usarlo.
2. **Versión actual = la de la rama productiva remota**, no la de la rama local ni la de `feature/CDA-XXXXX`:
   - `git fetch origin <rama-productiva>`
   - Maven: `git show origin/<rama-productiva>:pom.xml` → `/project/version` (no el `<version>` del `<parent>`).
   - npm: `git show origin/<rama-productiva>:package.json` → `version`.
3. **Cálculo** (la versión debe ser `X.Y.Z` numérico; si tiene sufijos como `-SNAPSHOT` o no cumple el formato, detenerse y preguntar):
   - **Release:** `X.Y.Z → X.(Y+1).0`
   - **Hotfix:** `X.Y.Z → X.Y.(Z+1)`
4. **Rollback = versión actual** de la rama productiva.
5. **Tag inexistente:** antes de aplicar, verificar que el tag que se va a generar no exista (`git ls-remote --tags origin <tag>`). Si existe, detenerse: la versión calculada ya se usó.
6. **Aplicación:** ejecutar el comando del proyecto **en el directorio del repo y con la rama `feature/CDA-XXXXX` activa**. Nunca sobre `master`, `master-mx`, `main`, `main-mx` ni ninguna rama productiva. Si `node_modules` no existe, ejecutar antes `npm install`.
   ```bash
   git -C <repo> rev-parse --abbrev-ref HEAD   # debe ser feature/CDA-XXXXX
   git -C <repo> status --porcelain            # debe estar vacío: el script hace `git add .`
   cd <repo> && npm run version-tag -- CDA-XXXXX <version_nueva>
   ```
   Si `status --porcelain` no está vacío (incluidos archivos sin trackear), detenerse: el script los commitearía junto con la versión.
   El comando hace commit, tag y **push**: solo se ejecuta si el usuario ya aprobó el plan del pase que lo incluye.
   **Push del tag (siempre, aparte):** el script crea un tag liviano (`git tag "$VERSION"`) y hace `git push --follow-tags`, que **solo sube tags anotados**, así que el tag queda solo en local. Inmediatamente después de `version-tag`, subirlo explícitamente y verificarlo:
   ```bash
   git -C <repo> rev-parse <version_nueva>                 # el tag existe en local
   git -C <repo> push origin <version_nueva>               # solo el tag, no toca ramas
   git -C <repo> ls-remote --tags origin <version_nueva>   # debe devolverlo
   ```
   Este push forma parte de "aplicar la versión": el plan del pase (P2) lo lista junto a `version-tag`, así que no necesita una aprobación aparte. Si el tag no existe en local, o el push falla o lo rechaza el remoto, detenerse (P3).
7. **Repos sin versión** (ej. Liquibase): no se ejecuta nada; Versión y Rollback = `-`.
8. **Versión ya aplicada** (típico al editar un CDA existente): si `origin/feature/CDA-XXXXX` ya tiene el commit `CHG: PP: MP: CDA-XXXXX version` y su archivo de versión es mayor que la productiva, **no volver a ejecutar `version-tag`**. Informar esa versión como nueva y la productiva como Rollback. Si esa versión no coincide con la regla de Release/Hotfix del tipo de pase actual (ej. el pase pasó de Hotfix a Release), detenerse y preguntar.

## Validaciones

Después de aplicar, por repositorio:

- El archivo de versión de `feature/CDA-XXXXX` tiene `version_nueva` (`git show HEAD:pom.xml` / `HEAD:package.json`).
- Existe el tag esperado en el remoto (`git ls-remote --tags origin <tag>`).
- `origin/feature/CDA-XXXXX` contiene los commits `CHG: PP: MP: CDA-XXXXX version` y `... tag` (`git log origin/feature/CDA-XXXXX -3 --oneline`).
- La rama productiva **no** cambió.

## Errores (detienen el flujo)

| Situación | Qué informar |
| --- | --- |
| No se puede leer la versión productiva | Repo, rama productiva y comando que falló |
| Versión con formato no numérico | Valor encontrado; pedir la versión a usar |
| Tag ya existe | Tag y commit al que apunta; pedir instrucciones |
| Rama activa distinta de `feature/CDA-XXXXX` | Rama actual; no ejecutar nada |
| Working tree no limpio (cambios o archivos sin trackear) | Lista de archivos; no ejecutar nada |
| `version-tag` falla o no hace push | Salida del comando; estado local (commits/tag creados sin push) |
| El push explícito del tag falla | Salida de `git push origin <tag>`; el tag existe solo en local |
| El comando dice "No hay cambios para hacer commit" | La versión ya estaba aplicada o el cálculo es igual a la actual: verificar y reportar |

## Ejemplos

| Tipo | Versión productiva | Nueva | Rollback | Comando |
| --- | --- | --- | --- | --- |
| Release | `1.109.2` | `1.110.0` | `1.109.2` | `npm run version-tag -- CDA-14643 1.110.0` |
| Hotfix | `1.109.0` | `1.109.1` | `1.109.0` | `npm run version-tag -- CDA-15367 1.109.1` |
| Liquibase | — | `-` | `-` | (no aplica) |
