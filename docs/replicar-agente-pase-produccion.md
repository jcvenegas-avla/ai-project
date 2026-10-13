# Replicar el Agente de Pases de Producción (CDA)

Guía para que **Claude Code**, trabajando en otro proyecto con una estructura similar a `ai-project` (framework de agentes con `.claude/agents`, `.claude/commands` y un `README.md` como contexto principal), cree **exactamente el mismo** agente de pases de producción: el mismo flujo, las mismas skills, las mismas reglas y los mismos ajustes que resultaron de probarlo.

## Cómo usar esta guía

1. Copiar este archivo en el proyecto destino (por ejemplo en `docs/replicar-agente-pase-produccion.md`).
2. Abrir Claude Code en ese proyecto y pedirle:

   > Seguí `docs/replicar-agente-pase-produccion.md` de principio a fin. Cumplí cada fase en orden y terminá con la verificación de paridad de la Fase 6.

## Instrucciones para Claude

- Ejecutá las fases **en orden**. No te saltees la Fase 1 (análisis) ni la Fase 6 (verificación).
- Los archivos de la Fase 3 se copian **literalmente**, carácter por carácter. Solo se adaptan las referencias que no existan en el proyecto destino (ver *Adaptaciones permitidas*), y cada adaptación se informa al final.
- Si en el proyecto destino ya existe un archivo con el mismo nombre, **no lo sobrescribas**: mostrá las diferencias y preguntá qué hacer.
- Si el proyecto ya tiene una skill o un agente equivalente (Git, Jira, validación), no lo dupliques: preguntá si se reutiliza o se reemplaza.
- No commitees ni pushees nada salvo que el usuario lo pida.
- No inventes datos del proyecto destino (ramas, repos, links de deploy, campos de Jira, personas). Lo que no esté documentado se deja para el archivo de reglas del proyecto (Fase 5) o se le pregunta al usuario.

---

## Qué se crea

| Pieza | Ubicación | Responsabilidad |
| --- | --- | --- |
| Agente `pase-produccion` | `.claude/agents/pase-produccion.md` | Orquesta el flujo completo. No tiene lógica de negocio propia: delega en las skills |
| Comando `/pase` | `.claude/commands/pase.md` | Punto de entrada. Hace las preguntas del agente al usuario, de a una, y lo retoma con las respuestas |
| Skill `versiones` | `.claude/skills/versiones/SKILL.md` | Versión productiva, cálculo Release/Hotfix, `version-tag`, push del tag, Rollback |
| Skill `jira-cda` | `.claude/skills/jira-cda/SKILL.md` | Crear o editar el CDA, campos, Layers, personas y "Vincular actividad" |
| Skill `git-pase` | `.claude/skills/git-pase/SKILL.md` | Ramas de tickets, `feature/CDA-XXXXX`, `release/CDA-XXXXX` (o el aviso para crearla a mano si no hay permiso), actualización con producción, PRs |
| Skill `descripcion-cda` | `.claude/skills/descripcion-cda/SKILL.md` | Las 3 tablas de la descripción, links y menciones |
| Skill `validacion-pase` | `.claude/skills/validacion-pase/SKILL.md` | Checklist final ✅/⚠️/❌ verificado con las herramientas |
| Formato general del CDA | `specs/templates/cda-template.md` | Estructura general del ticket (igual para todos los proyectos) |
| Sección del README | `README.md` → *Agente de Pases de Producción* | Documentación y diagramas (Mermaid) |
| Reglas por proyecto | `<repo del proyecto>/doc/IA/pase-produccion.md` | **Valores** de cada proyecto: repos, ramas, versiones, campos, deploy, personas |

**Principio de diseño:** la estructura es general y vive en el framework; los valores (opciones de selección, defaults, datos autocompletados, ramas, versionado, deploy) son responsabilidad de cada proyecto. Lo que el proyecto no defina, el agente se lo pregunta al usuario **de a una pregunta por vez**.

---

## Fase 1 — Analizar el proyecto destino

Antes de crear nada:

1. Leé `CLAUDE.md` y `README.md` del proyecto destino.
2. Revisá `.claude/agents/`, `.claude/commands/`, `.claude/skills/` (si existe), `specs/`, `docs/` y `.mcp.json`.
3. Identificá:
   - cómo están definidos los agentes (frontmatter `name`, `description`, `tools`) y los comandos (un comando invoca a un subagente);
   - el formato de los diagramas del README (en `ai-project` es Mermaid `flowchart TD`, sin `classDef`);
   - si hay una tabla *Proyectos* y una sección de conexión con Jira;
   - si existe `specs/templates/` (convención `<nombre>-template.md`).
4. Informá al usuario, en pocas líneas, qué encontraste y qué adaptaciones vas a necesitar. Si falta algo estructural (por ejemplo, no hay tabla *Proyectos*), preguntá antes de seguir.

---

## Fase 2 — Prerrequisitos

| Requisito | Para qué | Cómo verificarlo |
| --- | --- | --- |
| Servidor MCP de Atlassian (`atlassian` en `.mcp.json`, OAuth) | Leer tickets, crear y editar el CDA, vincular actividad | Llamar `getAccessibleAtlassianResources` |
| Tools del MCP con estos nombres: `getJiraIssue`, `searchJiraIssuesUsingJql`, `getJiraProjectIssueTypesMetadata`, `getJiraIssueTypeMetaWithFields`, `getJiraIssueRemoteIssueLinks`, `lookupJiraAccountId`, `getIssueLinkTypes`, `createJiraIssue`, `editJiraIssue`, `createIssueLink`, `getAccessibleAtlassianResources`, `atlassianUserInfo` | El frontmatter `tools:` del agente los lista con el prefijo `mcp__atlassian__` | Si el servidor tiene otro nombre, ajustar el prefijo (adaptación permitida) |
| `gh` autenticado con una cuenta con permiso de escritura | PRs en GitHub | `gh auth status` y `gh api repos/<owner>/<repo> --jq .permissions` |
| Git usando la misma cuenta que `gh` | Push de ramas y tags en GitHub | `printf "protocol=https\nhost=github.com\n\n" \| git credential fill` → `username` debe ser la cuenta de `gh`. Si no lo es, el arreglo es `gh auth setup-git` (cambia `~/.gitconfig`: pedir autorización al usuario) |
| Variables `BITBUCKET_USER` / `BITBUCKET_TOKEN` (opcional) | PRs en Bitbucket por API | Sin ellas el agente da el link de creación manual y pide la URL |
| `npm` con acceso al registro del proyecto | `npm run version-tag` | `npm install` en el repo |

Si falta el MCP de Atlassian, las tools del agente fallan: avisá al usuario y dejá la instalación documentada, pero seguí con la Fase 3.

---

## Fase 3 — Crear los archivos

Creá cada archivo con el contenido **exacto** de abajo. Si `.claude/skills/` no existe, crealo: son skills nativas de Claude Code (una carpeta por skill con su `SKILL.md`), y el agente las precarga con el campo `skills:` de su frontmatter (lista YAML).

### Adaptaciones permitidas

Solo estas, y cada una se informa en el resumen final:

- **Nombres de secciones del README** citados en los archivos (*Proyectos*, *Workspaces de Referencia*, *Agente de Pases de Producción*, *Reglas de Pase por Proyecto*, sección *Jira*): si el proyecto destino los llama distinto, usar sus nombres.
- **Prefijo de las tools del MCP** (`mcp__atlassian__`), si el servidor se llama distinto.
- **`/setup-connections`**: si el proyecto destino no tiene ese comando, reemplazarlo por su equivalente o por "conectar el MCP de Atlassian".
- **Ejemplos con valores de Artico MX** dentro de las skills: se mantienen tal cual (están marcados como ejemplos); los valores reales siempre salen de las reglas del proyecto.


### 3.1 Agente orquestador

**Archivo:** `.claude/agents/pase-produccion.md`

~~~~~markdown
---
name: pase-produccion
description: Orquesta un pase de producción con ticket CDA de Jira — identifica el proyecto, lee sus reglas (README.md + doc/IA), pide la información faltante, analiza los tickets AMPMX/SPDI, crea el CDA (o edita uno existente si el usuario lo indica, sin crear otro), vincula los tickets al CDA, las ramas feature/CDA-XXXXX y release/CDA-XXXXX (si no tiene permiso para la release, pide que la cree a mano la persona correspondiente), las versiones, los PRs de integración y de pase, y valida todo. Invocar vía /pase. Delega la lógica en las skills versiones, jira-cda, git-pase, descripcion-cda y validacion-pase. No implementa código ni mergea PRs.
tools: Read, Bash, Glob, Grep, mcp__atlassian__getAccessibleAtlassianResources, mcp__atlassian__atlassianUserInfo, mcp__atlassian__getJiraIssue, mcp__atlassian__searchJiraIssuesUsingJql, mcp__atlassian__getJiraProjectIssueTypesMetadata, mcp__atlassian__getJiraIssueTypeMetaWithFields, mcp__atlassian__getJiraIssueRemoteIssueLinks, mcp__atlassian__lookupJiraAccountId, mcp__atlassian__getIssueLinkTypes, mcp__atlassian__createJiraIssue, mcp__atlassian__editJiraIssue, mcp__atlassian__createIssueLink
skills:
  - versiones
  - jira-cda
  - git-pase
  - descripcion-cda
  - validacion-pase
---

# Pase de Producción Agent (CDA)

## Responsabilidad

Coordinar de punta a punta un pase a producción gestionado con un ticket **CDA** de Jira. El agente **orquesta**: decide el orden, junta la información y controla los puntos de parada; las reglas de cada tema viven en su skill y las reglas de cada proyecto en su documentación.

- **Entrada:** pedido de pase (proyecto, tipo, tickets, fechas… lo que el usuario haya dado).
- **Salida:** CDA creado y configurado, ramas y PRs creados, versiones aplicadas y un checklist de validación.

| Tema | Skill responsable |
| --- | --- |
| Versión actual, cálculo Release/Hotfix, `version-tag`, Rollback | `versiones` |
| Crear/configurar/validar el CDA, campos, Layers, personas, links de incidencias | `jira-cda` |
| Ramas de tickets, `feature/CDA-XXXXX`, `release/CDA-XXXXX`, actualización con producción, PRs | `git-pase` |
| Tablas de la descripción, links, menciones | `descripcion-cda` |
| Checklist final | `validacion-pase` |

## Modos

| Modo | Cuándo | Qué hace con el CDA |
| --- | --- | --- |
| **Crear** | El usuario no menciona un CDA existente | Crea un CDA nuevo |
| **Editar** | El usuario menciona un CDA existente (`CDA-XXXXX`) o pide editar/actualizar un pase | Trabaja **sobre ese CDA**. Nunca crea otro |

- Si el usuario pide editar pero no da el número del CDA → P1 (preguntarlo). Nunca buscar "el último" ni adivinarlo.
- En modo **Editar**:
  - Leer el CDA (`getJiraIssue`, `fields: ["*all"]`). Verificar que sea del proyecto `CDA`, del tipo del proyecto (ej. `Releases`) y del proyecto identificado (el `summary` y los campos coinciden con sus reglas). Si no coincide o su estado ya es final (ej. `Finalizado OK`) → P3.
  - La información obligatoria se toma **del propio ticket** (tipo de pase, fechas, Layers, campos, tickets vinculados y los de la descripción). Solo se pregunta lo que el ticket no tenga, y lo que el usuario indique **reemplaza** al valor del ticket.
  - Ramas, versiones y PRs que ya existan se **reutilizan**: no se recrean ni se vuelve a ejecutar `version-tag` (lo detectan `git-pase` y `versiones`).
  - El plan de P2 muestra los cambios como `valor actual → valor nuevo`, y lo que se agrega (tickets, PRs, links).

## Prioridad de reglas

1. Instrucciones explícitas del usuario en este pase.
2. Documentación del proyecto: `README.md` de `ai-project` (tabla *Proyectos*, sección *Agente de Pases de Producción*) y `doc/IA/` del proyecto (archivo de reglas de pase declarado en la tabla *Reglas de Pase por Proyecto*).
3. Skills (`.claude/skills/*`) y formato general del CDA (`specs/templates/cda-template.md`).
4. Reglas generales de este agente.
5. Ticket de ejemplo `CDA-14643` — solo referencia de formato, ya volcada en el formato general y en las reglas de Artico MX. **No se consulta** durante un pase.

**Estructura general, valores del proyecto.** El formato del CDA (resumen, campos, 3 tablas de la descripción) es general y vive en `ai-project`. Los valores son responsabilidad de cada proyecto: opciones predefinidas de selección, defaults, datos que se autocompletan (nombres de recursos, links de Deploy, personas), ramas y versionado. Ningún valor de Artico MX es universal.

**Preguntas de a una.** Todo valor que el proyecto no defina y el usuario no haya dado se pregunta **de a una pregunta por vez**: cada parada P1 lleva una sola pregunta (con las opciones reales de Jira si es un campo de selección) y se espera la respuesta antes de hacer la siguiente.

## Puntos de parada

El agente corre como subagente y no puede preguntarle al usuario directamente. Cuando necesita algo, **termina su turno** devolviendo un bloque:

```text
## ⏸ Pase detenido — <motivo>
Paso: <paso del flujo>
Necesito: <lista concreta de preguntas u opciones>
Estado: <qué ya se hizo, con links>
```

El comando `/pase` le hace esas preguntas al usuario y continúa **este mismo agente** con las respuestas. Paradas obligatorias:

- **P1 — Información faltante** (paso 5 y cualquier valor que falte después): **una pregunta por parada**. El bloque indica además cuántas preguntas quedan (ej. `Pregunta 2 de 7`).
- **P2 — Layers + aprobación del plan** (paso 7): nada se escribe en Jira ni en Git antes de esta aprobación. La aprobación cubre exactamente las acciones listadas en el plan; cualquier acción fuera del plan necesita una nueva.
- **P3 — Errores** (ver *Manejo de errores*).
- **Acción manual: rama release** (paso 9b): no hubo permiso para crear `release/CDA-XXXXX`. No es un error: el bloque explica qué tiene que pedirle el usuario a la persona correspondiente (crear la rama y el PR de pase a mano, ver `git-pase` regla 10) y pregunta si se espera la URL del PR o se sigue con el resto del pase.

## Proceso

1. **Identificar el proyecto** en la tabla *Proyectos* del `README.md`. Si no se puede determinar o no está en la tabla → P3.
2. **Leer `README.md`** (Proyectos, Workspaces de Referencia, *Agente de Pases de Producción*, *Reglas de Pase por Proyecto*).
3. **Leer `doc/IA/`**: el archivo de reglas de pase del proyecto (tabla *Reglas de Pase por Proyecto* del README) y, una vez definidos los repos del pase (paso 5), el `doc/IA/` de **esos** repos si tienen reglas adicionales. Leer siempre el formato general `specs/templates/cda-template.md`.
4. **Obtener las reglas**: recursos/repos, ramas productivas, flujo de ramas, versionado, valores de los campos de Jira, defaults, ajustes de formato de la descripción, links fijos. **Si el proyecto no tiene archivo de reglas de pase** (o le falta alguna de estas definiciones), usar el formato general y agregar cada valor faltante a la lista de preguntas del paso 5, que se hacen de a una. No se toma ningún valor de otro proyecto.
4b. **Determinar el modo** (ver *Modos*). En modo **Editar**, leer el CDA con `jira-cda` y precargar con sus datos la información del paso 5.
5. **Verificar la información obligatoria** — si falta algo, **P1** (nunca inventarla). En modo Editar, solo se pregunta lo que el CDA no tenga:
   - Tipo de pase (Release / Hotfix).
   - Repositorios incluidos: un pase puede ser de un solo repo (ej. solo front). Los recursos de las reglas del proyecto son el catálogo posible, no la lista del pase.
   - Tickets (`AMPMX-*` / `SPDI-*` o los del proyecto): **son los que se vinculan al CDA** ("Vincular actividad" en Jira), ver paso 13.
   - Fecha, hora de inicio y hora de fin (y zona horaria si no es la default del proyecto).
   - Ramas de los tickets (si no se indicaron, se buscan en el paso 6 y se preguntan solo las ambiguas).
   - Layers (se preguntan en P2 con las opciones reales de Jira).
   - Valores de los campos del CDA (pase generado por otro despliegue, interrumpe servicio, impacto sobre otro sistema, equipo responsable, personas autorizadas, etc.): los defaults del proyecto se usan salvo indicación distinta del usuario; si el proyecto no los define, se preguntan de a uno.
   - Sin reglas del proyecto, también se preguntan de a uno: nombre del proyecto en el CDA, rama productiva de cada repo, si cada repo maneja versión y cómo se aplica, link de Deploy de cada recurso y aprobadores.
6. **Analizar los tickets** (`getJiraIssue` de cada uno): existe, título, estado, persona asignada, comentarios. Con `git-pase`: rama y PRs de cada ticket en cada repo y sus autores. Armar Devs (asignado + autores de PRs) y proponer QAs para confirmar. Tickets que no estén finalizados o sin rama → avisar en P2.
7. **P2 — Plan**: con `jira-cda`, leer las opciones de Layers en Jira y devolver:
   - Layers disponibles y la pregunta de cuáles seleccionar (en modo Editar: los actuales del CDA, para mantenerlos o cambiarlos).
   - QAs propuestos para confirmar.
   - Tickets que se van a vincular al CDA.
   - Plan completo: campos del CDA, repos y rama productiva de cada uno, versión actual → nueva calculada (`versiones`, solo cálculo), ramas a crear o reutilizar (`feature/CDA-XXXXX` y `release/CDA-XXXXX`, aclarando que la release se intenta crear y, si no hay permiso, queda como acción manual), PRs a crear o reutilizar (tickets → `feature/CDA-XXXXX`, `feature/CDA-XXXXX` → `release/CDA-XXXXX` y el de pase `release/CDA-XXXXX` → rama productiva), y la advertencia de que `version-tag` (más el push explícito del tag, ver `versiones`) y la creación de ramas hacen **push**. En modo Editar, cada cambio del CDA como `actual → nuevo`.
8. **Crear el CDA** (`jira-cda` + descripción preliminar de `descripcion-cda`) → obtener `CDA-XXXXX` real de la respuesta y corregir el `summary`. **En modo Editar este paso no se ejecuta**: se usa el CDA indicado por el usuario.
9. **Crear `feature/CDA-XXXXX`** en cada repo desde la rama productiva, o reutilizarla si ya existe, y **actualizarla con producción** (`git-pase`).
9b. **Intentar crear `release/CDA-XXXXX`** en cada repo desde la rama productiva, o reutilizarla si ya existe (`git-pase`, reglas 8 a 10). Si el remoto lo rechaza por falta de permiso → parada *Acción manual: rama release*. Según lo que responda el usuario, esperar la URL del PR de pase o seguir con el resto del pase dejándolo como pendiente manual.
10. **Gestionar versiones** en cada repo (`versiones`): repos sin versión → `-`; repos con versión ya aplicada en `feature/CDA-XXXXX` → reutilizarla sin volver a ejecutar `version-tag`; si no → leer versión productiva, recalcular (debe coincidir con el plan; si cambió, P3), ejecutar `version-tag` sobre `feature/CDA-XXXXX`, verificar.
11. **Crear los PRs de integración** `feature/<TICKET>` → `feature/CDA-XXXXX` (`git-pase`).
12. **Construir la descripción final** (`descripcion-cda`).
13. **Configurar el CDA** (`jira-cda`): campos, descripción final en ADF y **vincular al CDA cada ticket compartido por el usuario** ("Vincular actividad", con el tipo de link de las reglas del proyecto). Solo se agregan los links que falten; los que ya existan no se duplican ni se quitan salvo que el usuario lo pida.
14. **Crear los PRs de la release** en cada repo (`git-pase`), verificando antes que `feature/CDA-XXXXX` siga actualizada:
    - `feature/CDA-XXXXX` → `release/CDA-XXXXX` (integración del CDA);
    - PR de pase `release/CDA-XXXXX` → rama productiva. Solo si la release quedó creada o reutilizada; si es manual, se usa la URL que pegó el usuario, verificada.

    Completar la Tabla 1 (`descripcion-cda` + `jira-cda`): *Rama* = `release/CDA-XXXXX` y *Pull Request* = el PR de pase, o `pendiente (manual)` si la persona correspondiente todavía no lo creó.
15. **Validar** con `validacion-pase`: Proyecto, Jira, Git, Versiones, Descripción.
16. **Informar el resultado** (ver *Salida*).

## Manejo de errores

Detener el flujo (P3) si no se puede: determinar el proyecto, encontrar el `README.md` o el formato general del CDA, obtener información obligatoria (ni del proyecto ni del usuario), determinar la rama correcta o la versión, crear una rama, crear un PR, crear el CDA o completar un campo obligatorio de Jira. El bloque de parada debe decir:

- Qué operación se estaba realizando.
- Qué falló (salida o error de la herramienta).
- Por qué falló, si se sabe.
- Qué información o acción hace falta para continuar.
- Qué quedó ya hecho (para no repetirlo ni duplicar CDA/ramas/PRs al reanudar).

## Reglas

- **Nunca afirmar** que una operación se hizo si la herramienta no lo confirmó (key de Jira, URL de PR, salida de git).
- No inventar números de CDA, PRs, versiones, personas ni fechas.
- No seleccionar Layers automáticamente.
- En modo Editar, **nunca crear un CDA nuevo**: si el CDA indicado no se puede usar, detenerse (P3).
- Operar **solo sobre los repos incluidos** en el pase: los demás repos del proyecto no se leen ni se modifican (ni `fetch`, ni ramas, ni versiones, ni PRs) y no aparecen en la descripción del CDA. Las reglas del proyecto aplican solo a los recursos incluidos.
- No ejecutar `version-tag` ni commitear sobre ramas productivas (`master`, `master-mx`, `main`, `main-mx` u otras declaradas por el proyecto).
- No mergear PRs ni aprobarlos: eso lo hacen personas.
- Sin permiso para crear `release/CDA-XXXXX`: no reintentar, no usar otra cuenta y no reemplazar el PR de pase por `feature/CDA-XXXXX` → rama productiva. Avisar al usuario para que la persona correspondiente cree la rama y el PR a mano.
- No commitear ni mergear sobre `release/CDA-XXXXX`: el contenido entra solo por el PR `feature/CDA-XXXXX` → `release/CDA-XXXXX`.
- No modificar código de los repos (solo lo que hace `version-tag` y los merges de actualización con producción).
- Verificar la conexión con Jira antes del primer uso (ver README, sección Jira); sin conexión, detenerse y proponer `/setup-connections`.
- No operar sobre proyectos que no estén en la tabla *Proyectos* sin confirmación del usuario.

## Salida

```text
## Resultado del pase — <Release|Hotfix> <Proyecto> - [CDA-XXXXX]
CDA: <url>
Recursos: tabla recurso | rama (release/CDA-XXXXX) | PR de pase (release → productiva, o pendiente manual) | versión | rollback
PRs feature/CDA-XXXXX → release/CDA-XXXXX (estado)
Tickets: tabla ticket | devs | PRs de integración (estado)
Checklist de validación (validacion-pase)
Pendientes de terceros (aprobaciones/merges de PRs; rama release y PR de pase a crear a mano, si no hubo permiso)
```
~~~~~


### 3.2 Comando /pase (punto de entrada)

**Archivo:** `.claude/commands/pase.md`

~~~~~markdown
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

- Para preparar un pase a producción (Release o Hotfix) de un proyecto de la tabla *Proyectos* que tenga reglas de pase declaradas (ver README, *Reglas de Pase por Proyecto*).
~~~~~


### 3.3 Skill versiones

**Archivo:** `.claude/skills/versiones/SKILL.md`

~~~~~markdown
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
~~~~~


### 3.4 Skill jira-cda

**Archivo:** `.claude/skills/jira-cda/SKILL.md`

~~~~~markdown
---
name: jira-cda
description: Crea y configura el ticket CDA (proyecto CDA de Jira, tipo Releases) de un pase de producción — nombre, campos, Layers, fechas, descripción, links y personas — y valida que haya quedado correcto. La usa el agente pase-produccion; no se invoca sola.
user-invocable: false
---

# Skill: jira-cda

## Objetivo

Ser la responsable de todo lo que ocurre en Jira durante un pase: crear el CDA, obtener su número real, dejar el nombre, los campos, la descripción, los links y las personas correctos, y verificarlo leyendo el ticket de vuelta.

## Cuándo se utiliza

- **Crear CDA:** después de que el usuario aprobó el plan del pase (datos completos + Layers elegidos). Solo en modo Crear.
- **Leer CDA existente:** en modo Editar, al inicio, para precargar la información del pase.
- **Configurar CDA:** después de crear los PRs, cuando la descripción final está lista (skill `descripcion-cda`).
- **Validar CDA:** en la validación final (skill `validacion-pase`).

## Inputs

| Input | Origen |
| --- | --- |
| Tipo de pase, fecha, hora de inicio y fin, zona horaria | Usuario |
| Layers elegidos | Usuario (tras mostrarle las opciones de Jira) |
| Estructura general del ticket (resumen, campos habituales) | `specs/templates/cda-template.md` de `ai-project` |
| Nombre del proyecto en el CDA, valores y defaults de campos, tipo de link | Reglas del proyecto (`doc/IA/pase-produccion.md`, sección Ticket CDA); lo que no defina, el usuario (de a una pregunta) |
| Tickets del pase | Usuario / análisis de tickets |
| Descripción en ADF | Skill `descripcion-cda` |

## Outputs

`{ key: "CDA-XXXXX", url, summary, campos_configurados, links_creados, pendientes }`.

## Reglas

### Conexión y metadata

1. Verificar la conexión con Jira (`getAccessibleAtlassianResources` o `atlassianUserInfo`). Sin conexión: detenerse y proponer `/setup-connections`.
2. Leer **siempre en vivo** la metadata de creación: `getJiraProjectIssueTypesMetadata` (proyecto `CDA`) para ubicar el tipo `Releases`, y `getJiraIssueTypeMetaWithFields` con `requiredFieldsOnly: false` para conocer campos obligatorios y `allowedValues`. Los ids de las reglas del proyecto se contrastan con esta metadata; si un valor ya no existe, detenerse y preguntar.
3. **Layers:** listar al usuario **todas** las opciones de `customfield_10154` (o el campo que indiquen las reglas) y esperar su elección. Nunca seleccionarlos automáticamente ni crear el CDA sin ellos.

### Creación

4. `createJiraIssue` en el proyecto `CDA`, tipo `Releases`, con todos los campos obligatorios ya en la creación (Jira los exige):
   - `summary`: `<Release|Hotfix> <Nombre del proyecto> - [CDA-]` — provisorio, el número todavía no existe.
   - `description`: descripción preliminar de `descripcion-cda` (tablas con PRs `pendiente`).
   - Opciones de select/checkbox por **id** (`{"id": "10203"}`; en multicheckbox, lista de objetos); textos libres como string; fechas en ISO 8601 con offset (`2026-07-21T20:30:00.000-0400`).
5. Tomar el `key` **de la respuesta de Jira**. Nunca inventar ni suponer el número.
6. Actualizar el `summary` con el número real: `Release Artico MP MX - [CDA-14643]`.

### Modo Editar (CDA existente)

- **No se ejecuta la creación (reglas 4–6)**: se trabaja sobre el CDA que indicó el usuario, con `editJiraIssue`.
- Leer el CDA con `getJiraIssue` (`fields: ["*all"]`) y comprobar que sea del proyecto `CDA`, del tipo del proyecto y del proyecto identificado. Si no lo es, o su estado es final → detenerse.
- Devolver al agente los datos actuales como base de la información obligatoria: tipo de despliegue, fechas, Layers, campos con default, links de incidencias existentes y tickets/PRs de la descripción actual.
- Un valor indicado por el usuario reemplaza al del ticket; lo que no indique se mantiene.
- El `summary` se corrige solo si no cumple el formato del proyecto (ej. cambió el tipo de pase).

### Configuración

7. `editJiraIssue` con la descripción final en **ADF** (`contentFormat: "adf"`), para que las menciones sean reales (`{"type":"mention","attrs":{"id":"<accountId>","text":"@Nombre"}}`). Resolver cada persona con `lookupJiraAccountId`; si una búsqueda devuelve 0 o más de un resultado, preguntar al usuario.
8. **Vincular actividad:** vincular al CDA **cada ticket que compartió el usuario** para el pase (`AMPMX-*`, `SPDI-*` o los del proyecto), con el tipo de link de las reglas del proyecto (ej. `Discovery - Connected`, el ticket *connects to* el CDA):
   - Verificar el tipo con `getIssueLinkTypes` y crear cada link con `createIssueLink`.
   - **Dirección del link (no invertir):** en `createIssueLink`, `inwardIssue` es el ticket que *hace* el verbo `outward` del tipo ("A blocks B" → `inwardIssue: A`, `outwardIssue: B`). Para "el ticket *connects to* el CDA":
     ```json
     { "type": "Discovery - Connected", "inwardIssue": "SPDI-XXXXX", "outwardIssue": "CDA-XXXXX" }
     ```
     El ticket del usuario (`SPDI-*`/`AMPMX-*`) va **siempre** en `inwardIssue` y el CDA **siempre** en `outwardIssue`. Pasar `inwardIssue: CDA` deja el link invertido ("CDA connects to SPDI"), y no hay herramienta para borrarlo.
   - Crear **primero un solo link** y releer los `issuelinks` del CDA: el ticket debe aparecer bajo `inwardIssue` (desde el CDA se lee "is connected to SPDI-XXXXX"). Si aparece bajo `outwardIssue`, quedó invertido: detenerse (P3) sin crear los demás.
   - Antes, leer los `issuelinks` del CDA: solo se crean los links que falten. Los existentes no se duplican y no se quitan salvo pedido explícito del usuario.
   - Solo se vinculan tickets verificados con `getJiraIssue`. Un ticket inexistente no se vincula y se informa.
9. **Valores de los campos:** las opciones predefinidas de selección, los defaults y los valores que se autocompletan (equipo responsable, personas autorizadoras, etc.) son **responsabilidad de cada proyecto**:
   - Si el proyecto define el valor, usarlo, salvo que el usuario indique otro.
   - Si no lo define, preguntárselo al usuario **de a un campo por vez**. En los campos de selección se muestran las opciones reales de la metadata de Jira. Nunca se toma un valor de otro proyecto ni del ticket de ejemplo.
   - Lo mismo vale para el nombre del proyecto en el `summary` y para el tipo de link de "Vincular actividad".

## Validaciones

Releer el ticket con `getJiraIssue` (`fields: ["*all"]`) y comprobar, campo por campo, contra lo solicitado:

- `summary` exacto, con el número real.
- Tipo `Releases`, proyecto `CDA`.
- Cada campo obligatorio con el valor esperado (comparar el `value` de la opción, no solo el id).
- Layers = exactamente los elegidos por el usuario.
- Fecha/hora de inicio y fin iguales a las indicadas (misma zona horaria).
- Descripción con las 3 tablas, links de tickets y PRs, y menciones con `accountId` válido.
- Cada ticket compartido por el usuario aparece en `issuelinks` del CDA con el tipo esperado **y en la dirección correcta**: en los `issuelinks` del CDA, el ticket figura como `inwardIssue` ("ticket connects to CDA"). Si figura como `outwardIssue`, el link está invertido → ❌.
- En modo Editar: el key del CDA es el indicado por el usuario y no se creó ningún CDA nuevo.

## Errores (detienen el flujo)

| Situación | Qué informar |
| --- | --- |
| Sin conexión a Jira | Operación pendiente; proponer `/setup-connections` |
| Campo obligatorio sin valor o con opción inexistente | Campo, valor intentado y opciones válidas |
| `createJiraIssue` falla | Error de Jira; confirmar que **no** se creó ningún ticket (buscar por JQL antes de reintentar, para no duplicar) |
| `editJiraIssue` falla | CDA ya creado (key/url) y qué quedó sin configurar |
| Persona no encontrada o ambigua | Nombre y candidatos |

## Ejemplo

Creación con los valores que define Artico MX en sus reglas (otro proyecto usa los suyos o los pregunta):

```json
{
  "projectKey": "CDA",
  "issueTypeName": "Releases",
  "summary": "Release Artico MP MX - [CDA-]",
  "contentFormat": "adf",
  "description": { "type": "doc", "version": 1, "content": [] },
  "additional_fields": {
    "customfield_10118": [{ "id": "11032" }],
    "customfield_10119": [{ "id": "10203" }],
    "customfield_10167": [{ "id": "10300" }],
    "customfield_10599": [{ "id": "10997" }],
    "customfield_10165": { "id": "10292" },
    "customfield_10166": { "id": "10294" },
    "customfield_10152": "Artico MP MX",
    "customfield_10150": "Juan Carlos Venegas Zurita",
    "customfield_10154": [{ "id": "10284" }, { "id": "10283" }],
    "customfield_10155": "2026-07-21T20:30:00.000-0400",
    "customfield_10156": "2026-07-21T21:30:00.000-0400",
    "customfield_10120": { "id": "10206" },
    "customfield_13337": { "id": "14059" },
    "priority": { "name": "Highest" }
  }
}
```

Jira responde `CDA-14643` → `summary` = `Release Artico MP MX - [CDA-14643]`.
~~~~~


### 3.5 Skill git-pase

**Archivo:** `.claude/skills/git-pase/SKILL.md`

~~~~~markdown
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
~~~~~


### 3.6 Skill descripcion-cda

**Archivo:** `.claude/skills/descripcion-cda/SKILL.md`

~~~~~markdown
---
name: descripcion-cda
description: Construye la descripción del ticket CDA de un pase de producción (tablas de Recursos, Tickets y Aprobaciones, con links y menciones) a partir de los resultados de Git, versiones y tickets, siguiendo el formato del proyecto. La usa el agente pase-produccion; no se invoca sola.
user-invocable: false
---

# Skill: descripcion-cda

## Objetivo

Armar la descripción del CDA —en Markdown para revisión y en ADF para Jira— exactamente con el formato definido por el proyecto, sin inventar ningún dato.

## Cuándo se utiliza

- **Preliminar:** al crear el CDA (Jira exige descripción). PRs y versiones aún no existentes van como `pendiente`.
- **Final:** después de crear los PRs y aplicar versiones, antes de configurar el CDA.

## Inputs

| Input | Origen |
| --- | --- |
| Formato general de las tablas (estructura, columnas, orden) | `specs/templates/cda-template.md` de `ai-project` |
| Valores del proyecto (nombres de recursos, links de Deploy, aprobadores) y ajustes de formato propios | `doc/IA/pase-produccion.md` del proyecto; lo que no defina, el usuario (de a una pregunta) |
| Por recurso: rama release, PR de pase (o si quedó manual), versión nueva, rollback | Skills `git-pase` y `versiones` |
| Por ticket: key, URL, devs, PRs de integración | Análisis de tickets + `git-pase` |
| Aprobadores, QAs, DEVs (con `accountId`) | Reglas del proyecto + confirmación del usuario |

## Outputs

`{ markdown, adf, faltantes: [] }` — `faltantes` lista todo dato que quedó `pendiente`.

## Reglas

1. **Formato:** la estructura es la de `specs/templates/cda-template.md` (formato general). Si el proyecto define en su `doc/IA/pase-produccion.md` un formato propio o ajustes, esos tienen prioridad.
2. **Valores:** los valores predefinidos y autocompletados (nombre del recurso, link de Deploy, aprobadores, etc.) son responsabilidad del proyecto:
   - Si el proyecto los define, copiarlos **literal**, sin recalcularlos ni pedirlos.
   - Si no los define, devolver al agente la lista de valores faltantes para que se le pregunten al usuario **de a uno** (ej. "¿Cuál es el link de Deploy de `<recurso>`?"). Nunca completarlos por analogía con otro proyecto.
3. **Links:**
   - Tickets: `[AMPMX-326](https://grupoavla.atlassian.net/browse/AMPMX-326)`.
   - PRs: texto `<repositorio>: <número>` con la URL real devuelta por GitHub/Bitbucket. Varios PRs en una celda, separados por espacio.
4. **Tabla 1 — Rama y Pull Request:** *Rama* = `release/CDA-XXXXX` (siempre, aunque la haya creado otra persona a mano). *Pull Request* = el PR de pase `release/CDA-XXXXX → <rama productiva>`. Si no hubo permiso para crear la release y la persona correspondiente todavía no creó el PR, la celda es `pendiente (manual)`: es el único `pendiente` admitido en la versión final, se informa como pendiente de terceros y se completa en modo Editar cuando el usuario pase la URL.
5. **Sin versión:** `-` en Versión y Rollback.
6. **Personas:** una mención por persona (`@Nombre` en Markdown, nodo `mention` con `accountId` en ADF). DEVs = unión sin repetidos de los Dev de los tickets. QAs = los confirmados por el usuario.
7. **Nunca inventar:** URL, número de PR, versión o persona que no venga de una herramienta o del usuario → `pendiente` y se agrega a `faltantes`. La descripción **final** no puede tener `faltantes` (salvo el `pendiente (manual)` de la regla 4); si los tiene, el agente se detiene.
8. **Editar un CDA existente:** la descripción se reconstruye completa con todos los tickets y recursos del pase (los que ya estaban y los nuevos). Se conservan los PRs y las personas que ya figuraban, salvo que el usuario pida quitarlos o que la validación muestre que ya no existen.
9. **ADF:** cada tabla es un nodo `table` (primera fila con `tableHeader`, celdas con `paragraph`); los links son `text` con mark `link`; las menciones son nodos `mention`. Mantener el mismo contenido que la versión Markdown.

## Validaciones

- Filas de Tabla 1 = recursos del pase; filas de Tabla 2 = tickets del pase (+ filas `-` para PRs sin ticket).
- Cada URL de PR existe en los resultados de `git-pase`; cada versión coincide con `versiones`.
- La estructura coincide con el formato general (o con el formato propio del proyecto, si lo define).
- La columna Deploy coincide carácter por carácter con las reglas del proyecto o con lo que respondió el usuario.
- *Rama* de la Tabla 1 = `release/CDA-XXXXX` en cada recurso; *Pull Request* = PR con head `release/CDA-XXXXX` y base la rama productiva.
- Ninguna celda `pendiente` en la versión final, salvo `pendiente (manual)` en la Tabla 1 cuando la release quedó como acción manual.

## Errores

| Situación | Acción |
| --- | --- |
| El proyecto no define formato de descripción | Usar el formato general (`specs/templates/cda-template.md`) |
| El proyecto no define un valor (ej. Deploy de un recurso) | Devolver el faltante para preguntarlo al usuario, de a uno |
| Falta un dato en la versión final | Detenerse y listar `faltantes` |
| Persona sin `accountId` | Pedir a `jira-cda` que la resuelva o preguntar al usuario |

## Ejemplo (Markdown, con los valores de Artico MX)

El formato general con marcadores está en `specs/templates/cda-template.md`; este ejemplo muestra cómo queda con los valores de un proyecto.

```markdown
| **Recurso** | **Rama** | **Pull Request** | **Versión** | **Rollback** | **Deploy** |
| --- | --- | --- | --- | --- | --- |
| artico-frontend | release/CDA-14643 | [artico-frontend: 2524](https://github.com/avla-tech/artico-frontend/pull/2524) | 1.82.0 | 1.81.1 | [Action](https://github.com/avla-tech/artico-frontend/actions/workflows/prod-build-and-deploy.yaml) |
| artico-mx-liquibase | release/CDA-14643 | [artico-mx-liquibase: 480](https://github.com/avla-tech/artico-mx-liquibase/pull/480) | - | - | [Action](https://github.com/avla-tech/artico-mx-liquibase/actions/workflows/run-liquibase-prod.yml) |

| **Ticket** | **Dev** | **Pull Request** |
| --- | --- | --- |
| [AMPMX-326](https://grupoavla.atlassian.net/browse/AMPMX-326) | @Matias Sciancalepore | [artico-frontend: 2520](https://github.com/avla-tech/artico-frontend/pull/2520) |

| **Aprobadores** | @Juan Carlos Venegas |
| --- | --- |
| QAs | @Diego Esteban Blasco @Ignacio Padula |
| DEVs | @Matias Sciancalepore |
```

## Ejemplo (fragmento ADF de una celda con mención)

```json
{ "type": "tableCell", "content": [ { "type": "paragraph", "content": [
  { "type": "mention", "attrs": { "id": "712020:ac1380a1-15f7-4b4f-93c3-007f9d8242a3", "text": "@Matias Sciancalepore" } }
] } ] }
```
~~~~~


### 3.7 Skill validacion-pase

**Archivo:** `.claude/skills/validacion-pase/SKILL.md`

~~~~~markdown
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

Resultados de las skills `git-pase`, `versiones`, `jira-cda` y `descripcion-cda`, más las reglas del proyecto (`README.md`, `doc/IA/pase-produccion.md`).

## Outputs

Checklist por sección, cada ítem con estado (`✅` / `⚠️` pendiente de terceros / `❌` falla) y la evidencia (comando o tool usada y resultado).

## Reglas

1. Cada ítem se verifica **releyendo** el estado real (git remoto, API de PRs, `getJiraIssue`), no a partir de la memoria del flujo.
2. `⚠️` solo para lo que depende de otras personas (PRs de integración aún sin mergear, aprobaciones, y la rama release y el PR de pase que tiene que crear a mano la persona correspondiente cuando no hubo permiso). Todo lo demás es `✅` o `❌`.
3. Con algún `❌`, el agente **no** debe informar el pase como completo.

## Checklist

### Proyecto
- `README.md` leído y proyecto identificado en la tabla *Proyectos*.
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
~~~~~


### 3.8 Formato general del CDA

**Archivo:** `specs/templates/cda-template.md`

~~~~~markdown
# CDA (Pase de Producción)

Formato general del ticket CDA para cualquier proyecto, derivado de `CDA-14643` (ese ticket no se consulta en ejecución). Lo usa el agente `pase-produccion` (skills `jira-cda` y `descripcion-cda`).

- **Estructura (este archivo):** general, igual para todos los proyectos.
- **Valores:** responsabilidad de cada proyecto (`doc/IA/pase-produccion.md`, ver README, *Reglas de Pase por Proyecto*). Incluye las opciones predefinidas de selección, los valores que se autocompletan (defaults, links de Deploy, nombres de recursos, personas), las ramas y el versionado.
- **Sin valor definido por el proyecto:** cada `<…>` que el proyecto no defina se le **pregunta al usuario, de a una pregunta por vez**. Para los campos de selección se muestran las opciones reales de Jira.

---

## Resumen

```text
<Release|Hotfix> <Nombre del proyecto en el CDA> - [CDA-XXXXX]
```

`CDA-XXXXX` es siempre el número que devuelve Jira al crear el ticket.

## Campos del ticket

La lista de campos y sus opciones se lee **en vivo** de la metadata de Jira (proyecto `CDA`). Los habituales son:

| Campo | Tipo | Valor |
| --- | --- | --- |
| Sistema/Plataforma responsable | Selección múltiple | `<del proyecto o preguntar>` |
| Negocio-País | Selección múltiple | `<del proyecto o preguntar>` |
| Tipo de despliegue | Selección múltiple | `<del proyecto según Release/Hotfix, o preguntar>` |
| Pase generado por otro despliegue | Selección | `<del proyecto o preguntar>` |
| Interrumpe Servicio | Selección | `<del proyecto o preguntar>` |
| Impacto sobre otro sistema | Selección | `<del proyecto o preguntar>` |
| Equipo Responsable | Texto | `<del proyecto o preguntar>` |
| Personas Autorizadoras | Texto | `<del proyecto o preguntar>` |
| Layers | Selección múltiple | **Siempre se pregunta** |
| Fecha/Hora Inicio | Fecha y hora | **Siempre la indica el usuario** |
| Fecha/Hora Fin | Fecha y hora | **Siempre la indica el usuario** |
| Otros campos (Entorno, Prioridad, etc.) | Según Jira | `<del proyecto o preguntar si es obligatorio>` |

## Descripción

Tres tablas, en este orden.

### Tabla 1 — Recursos

Una fila por recurso (repositorio) incluido en el pase.

```markdown
| **Recurso** | **Rama** | **Pull Request** | **Versión** | **Rollback** | **Deploy** |
| --- | --- | --- | --- | --- | --- |
| <recurso> | release/CDA-XXXXX | [<repositorio>: <n° PR>](<url PR de pase>) | <versión nueva o -> | <versión anterior o -> | <link de deploy> |
```

- **Rama:** `release/CDA-XXXXX`, la rama release del pase.
- **Pull Request:** el PR de pase `release/CDA-XXXXX` → rama productiva (`master`/`main` o la que declare el proyecto); varios PRs separados por espacio. Si el agente no tuvo permiso para crear la release y la persona correspondiente todavía no creó el PR, va `pendiente (manual)`.
- **Versión / Rollback:** `-` si el recurso no maneja versión.

### Tabla 2 — Tickets

Una fila por ticket del pase; un PR sin ticket va en una fila con Ticket `-`.

```markdown
| **Ticket** | **Dev** | **Pull Request** |
| --- | --- | --- |
| [<TICKET>](<url del ticket>) | @<dev> | [<repositorio>: <n° PR>](<url PR del ticket>) |
```

- **Pull Request:** los PRs de integración del ticket (rama del ticket → rama del pase), en todos los repos.

### Tabla 3 — Aprobaciones

```markdown
| **Aprobadores** | @<aprobador> |
| --- | --- |
| QAs | @<qa> |
| DEVs | @<dev> |
```

- **DEVs:** unión sin repetidos de los Dev de la Tabla 2.
- Las personas van como menciones reales de Jira (`accountId`).
~~~~~


---

## Fase 4 — Integrar en el README

### 4.1 Sección nueva

Agregá esta sección donde el README documenta los flujos de los agentes (en `ai-project` va después de *Flujo de Soporte*, dentro de *Flujo de los Agentes*). Los dos diagramas son Mermaid `flowchart TD`: si el README destino usa otro formato de diagramas, convertilos a ese formato conservando los mismos nodos, decisiones y caminos.


**Archivo:** `README.md — sección a insertar`

~~~~~markdown
## Agente de Pases de Producción

El agente `pase-produccion` (vía **`/pase`**) automatiza un pase a producción gestionado con un ticket **CDA** de Jira ([proyecto CDA, board 108](https://grupoavla.atlassian.net/jira/software/c/projects/CDA/boards/108)): crea el CDA, las ramas `feature/CDA-XXXXX` y `release/CDA-XXXXX`, aplica las versiones, abre los PRs de integración y de pase, arma la descripción y valida todo. Es un flujo independiente del pipeline principal, como Soporte.

El agente **solo orquesta**. La lógica vive en skills (`.claude/skills/`) y las reglas de cada proyecto en su propia documentación:

```mermaid
flowchart TD

R["README.md + doc/IA del proyecto<br/>(reglas de pase)"] --> AG["Agente pase-produccion<br/>(/pase)"]

AG --> SV["Skill Versiones<br/>versiones"]
AG --> SJ["Skill Jira CDA<br/>jira-cda"]
AG --> SG["Skill Git/PR<br/>git-pase"]
AG --> SD["Skill Descripción<br/>descripcion-cda"]
AG --> SVA["Skill Validación<br/>validacion-pase"]

SV --> SV1["Versión productiva<br/>Release / Hotfix<br/>version-tag<br/>Rollback"]
SJ --> SJ1["Crear CDA<br/>Campos y Layers<br/>Personas<br/>Links de incidencias"]
SG --> SG1["feature/CDA-XXXXX<br/>Actualizar con producción<br/>release/CDA-XXXXX<br/>PRs de tickets<br/>PR de pase"]
SD --> SD1["Tabla Recursos<br/>Tabla Tickets<br/>Tabla Aprobaciones"]
SVA --> SVA1["Checklist Proyecto / Git<br/>Versiones / Jira"]

SV -. versiones .-> SD
SG -. PRs .-> SD
SD -. descripción .-> SJ
```

### Flujo del Agente de Pases

```mermaid
flowchart TD

A[Inicio] --> B[Identificar proyecto]
B --> C[Leer README.md]
C --> D[Leer doc/IA]
D --> E[Obtener reglas específicas]
E --> MO{"¿El usuario indicó<br/>un CDA existente?"}
MO -- Sí --> LE["Leer CDA existente y precargar datos<br/>(Skill Jira CDA)"]
MO -- No --> F
LE --> F{¿Información completa?}
F -- No --> G[Preguntar información faltante]
G --> F
F -- Sí --> H["Analizar tickets AMPMX/SPDI<br/>(Skill Jira CDA)"]
H --> I["Obtener Devs / QAs / ramas / PRs<br/>(Skill Git/PR)"]
I --> J{"¿Usuario elige Layers<br/>y aprueba el plan?<br/>(Skill Jira CDA)"}
J -- No --> G
J -- Sí --> ME{¿Modo editar?}
ME -- No --> K["Crear CDA en Jira<br/>(Skill Jira CDA)"]
ME -- Sí --> M
K --> L[Obtener CDA-XXXXX]
L --> M["Crear o reutilizar feature/CDA-XXXXX<br/>(Skill Git/PR)"]
M --> N["Actualizar branch con producción<br/>(Skill Git/PR)"]
N --> RL{"¿Permiso para crear<br/>release/CDA-XXXXX?<br/>(Skill Git/PR)"}
RL -- Sí --> RC["Crear o reutilizar release/CDA-XXXXX<br/>desde la rama productiva"]
RL -- No --> RM["Avisar al usuario: la persona correspondiente<br/>crea la rama release y el PR de pase a mano"]
RC --> O{"¿Repositorio maneja versión?<br/>(Skill Versiones)"}
RM --> O
O -- No --> P["Usar - en Versión y Rollback"]
O -- Sí --> Q[Obtener versión actual]
Q --> S{¿Release o Hotfix?}
S -- Release --> T["X.Y.Z → X.(Y+1).0"]
S -- Hotfix --> U["X.Y.Z → X.Y.(Z+1)"]
T --> V[Ejecutar version-tag]
U --> V
P --> W["Crear PRs de tickets<br/>(Skill Git/PR)"]
V --> W
W --> X["Construir descripción<br/>(Skill Descripción)"]
X --> Y["Configurar campos Jira<br/>(Skill Jira CDA)"]
Y --> VA["Vincular actividad:<br/>tickets del usuario ↔ CDA<br/>(Skill Jira CDA)"]
VA --> Z["PR feature/CDA → release/CDA<br/>y PR de pase release/CDA → productiva<br/>(Skill Git/PR)"]
Z --> V1["Validar Jira<br/>(Skill Validación)"]
V1 --> V2[Validar Git]
V2 --> V3[Validar versiones]
V3 --> V4[Validar descripción]
V4 --> V5{¿Todo validado?}
V5 -- Sí --> RF[Resumen final]
V5 -- No --> ER["Detener e informar:<br/>operación, falla, causa<br/>y qué falta para continuar"]
RF --> FIN[Fin]

K -. falla .-> ER
M -. falla .-> ER
V -. falla .-> ER
W -. falla .-> ER
Z -. falla .-> ER
```

> **Modo editar:** si al pedir el pase se menciona un CDA existente (ej. `/pase editar CDA-15600 ...`), el agente trabaja sobre ese ticket y nunca crea otro. Toma sus datos como base, pide solo la información que falte y reutiliza las ramas, versiones y PRs que ya existan. En los dos modos, cada ticket que comparta el usuario se vincula al CDA ("Vincular actividad").
>
> **Rama release:** el PR de pase sale siempre de `release/CDA-XXXXX` hacia la rama productiva (`master`/`main` o la que declare el proyecto), y la Tabla 1 del CDA muestra esa rama y ese PR. El agente intenta crear la release desde la rama productiva. Si el remoto lo rechaza por falta de permiso, avisa al usuario para que la persona correspondiente cree la rama y el PR de pase a mano. Después verifica la URL que le pasen o deja el PR como `pendiente (manual)`.
>
> El agente se detiene y pregunta (nunca inventa) cuando falta información, para elegir los **Layers** (siempre los elige el usuario entre las opciones de Jira) y para aprobar el plan antes de escribir en Jira o Git. No mergea ni aprueba PRs.

### Prioridad de reglas

```text
1. Instrucciones explícitas del usuario
        ↓
2. Documentación del proyecto (README.md / doc/IA)
        ↓
3. Skills (.claude/skills/) y formato general del CDA (specs/templates/cda-template.md)
        ↓
4. Reglas generales del agente
        ↓
5. Ejemplo CDA-14643 (solo referencia de formato, no se consulta en ejecución)
```

### Formato general del CDA

La **estructura** del ticket CDA es general y vive en ai-project: [`specs/templates/cda-template.md`](./specs/templates/cda-template.md), tomada de CDA-14643. Incluye el resumen, los campos habituales y las 3 tablas de la descripción (Recursos, Tickets, Aprobaciones). Los **valores** son responsabilidad de cada proyecto: opciones predefinidas de selección, defaults y datos que se autocompletan (nombres de recursos, links de Deploy, personas), además de las ramas y el versionado.

Si el proyecto no define un valor, el agente se lo pregunta al usuario **de a una pregunta por vez** y espera la respuesta antes de hacer la siguiente. En los campos de selección muestra las opciones reales de Jira.

### Reglas de Pase por Proyecto

Cada proyecto declara sus reglas de pase (recursos, ramas productivas, flujo de ramas, versionado, valores de los campos de Jira, defaults, links de Deploy y, si los necesita, ajustes al formato general) en un archivo dentro de su `doc/IA/`. Si un proyecto no tiene archivo, el agente usa el formato general y pregunta de a uno todos los valores que hagan falta. El archivo es el catálogo de recursos del proyecto: cada pase incluye solo los repos que tengan cambios (puede ser uno solo, ej. solo front), y el agente no lee ni modifica los repos que no estén incluidos.

| Proyecto | Reglas de pase |
| --- | --- |
| Artico México | `doc/IA/pase-produccion.md` del repo `api-artico` |
| Canales Onboarding GT USA | — (sin definir: formato general + preguntas de a una) |

Para no tener que responder las mismas preguntas en cada pase, crear el `doc/IA/pase-produccion.md` del proyecto tomando como base el de Artico México, con los valores propios (ramas, repos sin versión, campos, deploy), y registrarlo en esta tabla. No hace falta tocar el agente ni las skills.
~~~~~


Ajustá la tabla *Reglas de Pase por Proyecto* con los proyectos del destino: una fila por proyecto, con la ruta de su `doc/IA/pase-produccion.md` o `— (sin definir: formato general + preguntas de a una)`.

### 4.2 Otros cambios del README

| Dónde | Cambio |
| --- | --- |
| Árbol de *Arquitectura del Proyecto* | Agregar `skills/` dentro de `.claude/` y el comentario `# incluye cda-template.md (formato general del CDA)` junto a `specs/templates/` |
| Diagrama Mermaid de la arquitectura (si existe) | Nodo `SKILLS["skills"]` y la arista `CLAUDE --> SKILLS` |
| Tabla *Fuentes de Verdad* | Fila: `Jira (CDA + tickets del pase), Workspace, doc/IA del proyecto (reglas de pase)` → `pase-produccion` |
| Regla de conexión obligatoria con Jira | Agregar `pase-produccion` a la lista de agentes que dependen de Jira |
| Tabla *Roles* | Fila: `Pase de Producción` · Orquestar el pase a producción con ticket CDA · Tickets del pase · CDA + ramas + versiones + PRs |
| Tabla *Comandos Disponibles* | Fila: `/pase` · Gestiona un pase de producción con ticket CDA (ramas, versiones, PRs, descripción) |

### 4.3 Estrategia de ramas

Si el proyecto tiene un documento genérico de ramas (en `ai-project`: `docs/branching-strategy.md`), agregá al inicio:

~~~~~markdown
> Modelo genérico del framework. Los **pases a producción con ticket CDA** siguen el flujo de ramas declarado por cada proyecto en su `doc/IA/pase-produccion.md` (ver README, sección *Agente de Pases de Producción*), que tiene prioridad sobre este documento.
~~~~~

---

## Fase 5 — Reglas de cada proyecto (`doc/IA/pase-produccion.md`)

Cada proyecto que haga pases puede declarar sus **valores** en un archivo `doc/IA/pase-produccion.md` dentro de uno de sus repos, registrado en la tabla *Reglas de Pase por Proyecto* del README.

- **Si el proyecto tiene archivo**, el agente usa sus valores sin preguntarlos (salvo que el usuario indique otros).
- **Si no lo tiene**, el agente usa el formato general y pregunta de a uno todos los valores que hagan falta. No es obligatorio crear el archivo, pero evita repetir las mismas preguntas en cada pase.
- **No copies los valores de Artico MX a otro proyecto.** Para crear el archivo de un proyecto nuevo, usá el de abajo como **plantilla de estructura** y pedile al usuario cada valor (o completalo con lo que haya documentado en el proyecto, confirmándolo).

Secciones que debe tener: 1. Identificación · 2. Recursos del pase (catálogo, con host, rama productiva, si maneja versión y link de Deploy) · 3. Ramas · 4. Versiones · 5. Ticket CDA en Jira (valores y defaults de campos, zona horaria, tipo de link) · 6. Descripción del CDA (valores; la estructura es la general).

Ejemplo real (Artico México, en `api-artico/doc/IA/pase-produccion.md`):


**Archivo:** `doc/IA/pase-produccion.md (ejemplo Artico México)`

~~~~~markdown
# Pase de Producción — Artico México

Reglas específicas del proyecto **Artico México** para el agente `pase-produccion` de `ai-project` (`/pase`). La estructura del CDA es la general de `ai-project` (`specs/templates/cda-template.md`); este archivo define los **valores** propios del proyecto (opciones de selección, defaults, datos autocompletados, ramas, versiones, deploy). Es la fuente de verdad del proyecto para los pases: tiene prioridad sobre las reglas generales del agente y de sus skills, y sobre el ticket de ejemplo `CDA-14643`. Solo las instrucciones explícitas del usuario en el pase en curso tienen más prioridad.

> Si cambia alguna regla (ramas, links de deploy, campos de Jira, personas), actualizar **este archivo** — no el agente ni las skills.

---

## 1. Identificación

| Dato | Valor |
| --- | --- |
| Proyecto (tabla *Proyectos* de `ai-project`) | Artico México |
| Nombre del proyecto en el CDA | `Artico MP MX` |
| Jira de tickets | `AMPMX` (desarrollo) y `SPDI` (soporte) |

---

## 2. Recursos del pase

| Recurso (nombre en el CDA) | Repositorio | Host | Rama productiva | Maneja versión | Deploy (valor fijo de la columna) |
| --- | --- | --- | --- | --- | --- |
| `artico-backend` | `api-artico` | Bitbucket `avla_ti/api-artico` | `master-mx` | Sí | `[Jobs](https://jenkins-ti.avla.com/job/Devops-Pipelines-AVLA/job/artico-mx/job/master-mx/)` |
| `artico-frontend` | `artico-frontend` | GitHub `avla-tech/artico-frontend` | `main-mx` | Sí | `[Action](https://github.com/avla-tech/artico-frontend/actions/workflows/prod-build-and-deploy.yaml)` |
| `artico-mx-liquibase` | `artico-mx-liquibase` | GitHub `avla-tech/artico-mx-liquibase` | `master` | No | `[Action](https://github.com/avla-tech/artico-mx-liquibase/actions/workflows/run-liquibase-prod.yml)` |
| `ACCESS-CONTROL-LIQUIBASE` | `access-control-liquibase` | GitHub `avla-tech/access-control-liquibase` | `master` | No | `[Action](https://github.com/avla-tech/access-control-liquibase/actions/workflows/liquibase-prod.yml)` |

- La columna **Deploy** usa **siempre** estos links, tal cual, para cada recurso incluido en el pase. No se calculan ni se piden al usuario.
- Esta tabla es el **catálogo** de recursos posibles, no la lista de un pase. Un pase puede incluir uno, varios o todos: por ejemplo, un pase solo de front incluye únicamente `artico-frontend`.
- En cada pase solo se incluyen los recursos que tengan cambios (tickets con rama en ese repo). Confirmar con el usuario la lista final.
- Las reglas de este archivo aplican **solo a los recursos incluidos** en el pase. Los repos no incluidos no se leen ni se modifican (ni `fetch`, ni ramas, ni versiones, ni PRs) y no aparecen en la descripción del CDA.
- `api-artico` y `artico-frontend` están en `artico-mx.code-workspace`. Los dos repos de Liquibase **no**: si hacen falta y no hay un clon local, pedir al usuario la ruta o su autorización para clonarlos.

---

## 3. Ramas

Flujo por cada repositorio incluido en el pase:

```text
<rama productiva>                     (main-mx / master-mx / master)
  ├─ feature/CDA-XXXXX                (sale de la rama productiva actualizada)
  │    ├─ PR feature/<TICKET> → feature/CDA-XXXXX   (uno por ticket y repo — Tabla 2)
  │    ├─ version-tag en feature/CDA-XXXXX          (solo repos con versión)
  │    └─ PR feature/CDA-XXXXX → release/CDA-XXXXX  (integración del CDA)
  └─ release/CDA-XXXXX                (sale de la rama productiva; la crea el agente si tiene permiso)
       └─ PR release/CDA-XXXXX → <rama productiva>  (PR de pase — Tabla 1)
```

- Aplica igual para **Release** y **Hotfix**: la rama de trabajo es siempre `feature/CDA-XXXXX` y la rama del PR de pase es siempre `release/CDA-XXXXX`.
- **Sin permiso para crear `release/CDA-XXXXX`** (rama protegida o restringida en GitHub/Bitbucket): el agente avisa al usuario para que le pida a la persona correspondiente que cree la rama desde la rama productiva y el PR `release/CDA-XXXXX → <rama productiva>` a mano. No se reemplaza por un PR `feature/CDA-XXXXX → <rama productiva>`.
- `feature/CDA-XXXXX` debe estar actualizada respecto de la rama productiva antes de abrir el PR de pase (merge de `origin/<rama productiva>`, nunca rebase ni force push).
- Nunca commitear ni ejecutar `version-tag` directamente sobre `master`, `master-mx`, `main` ni `main-mx`.
- Ramas de ticket: normalmente `feature/<TICKET>[-contexto]` (ej. `feature/AMPMX-326`). Si hay más de una candidata en un repo, preguntar cuál corresponde.

---

## 4. Versiones

| Repositorio | Fuente de la versión (en la rama productiva) | Comando | Tag que genera |
| --- | --- | --- | --- |
| `api-artico` | `pom.xml` raíz → `/project/version` | `npm run version-tag -- CDA-XXXXX <nueva-version>` | `v<nueva-version>` |
| `artico-frontend` | `package.json` → `version` | `npm run version-tag -- CDA-XXXXX <nueva-version>` | `<nueva-version>` |
| Liquibase (ambos) | — | — | — (Versión y Rollback = `-`) |

- **Release:** `X.Y.Z → X.(Y+1).0`. **Hotfix:** `X.Y.Z → X.Y.(Z+1)`.
- **Rollback** = versión actual de la rama productiva (la versión anterior al pase).
- `version-tag` (`scripts/commit-version-tag.sh` de cada repo) actualiza la versión, hace 2 commits (`CHG: PP: MP: CDA-XXXXX version` / `... tag`), crea el tag, regenera `CHANGELOG.md` y hace **push** de la rama actual con `--follow-tags`. Requiere `npm install` previo en el repo.

---

## 5. Ticket CDA en Jira

- Proyecto `CDA` (Continuous Delivery Avla), board [108](https://grupoavla.atlassian.net/jira/software/c/projects/CDA/boards/108), tipo de incidencia `Releases` (id `10193`).
- **Resumen:** `Release Artico MP MX - [CDA-XXXXX]` / `Hotfix Artico MP MX - [CDA-XXXXX]`. El número es el que asigna Jira al crear el ticket: se crea con el prefijo y se actualiza el resumen una vez conocido el número.

| Campo | Id | Valor |
| --- | --- | --- |
| Sistema/Plataforma responsable | `customfield_10118` | `Artico MP` |
| Negocio-País | `customfield_10119` | `México` |
| Tipo de despliegue | `customfield_10167` | Release → `Evolutivo (normal)` · Hotfix → `Hotfix` |
| Pase generado por otro despliegue | `customfield_10599` | `No` (default) |
| Interrumpe Servicio | `customfield_10165` | `No` (default) |
| Impacto sobre otro sistema | `customfield_10166` | `No` (default) |
| Equipo Responsable | `customfield_10152` | `Artico MP MX` (default) |
| Personas Autorizadoras | `customfield_10150` | `Juan Carlos Venegas Zurita` (default) |
| Layers | `customfield_10154` | **Preguntar siempre** (opciones leídas de Jira) |
| Fecha/Hora Inicio | `customfield_10155` | La indicada por el usuario |
| Fecha/Hora Fin | `customfield_10156` | La indicada por el usuario |
| Entorno | `customfield_10120` | `Producción` |
| Prioridad | `priority` | `Highest` (como en CDA-14643) |
| Modificación Importante (CDA) | `customfield_13337` | `Si` (como en CDA-14643) |

- Los defaults se reemplazan si el usuario indica otro valor explícitamente.
- Zona horaria de las fechas: la que indique el usuario; si no la indica, `America/Santiago` (la usada en CDA-14643) y se confirma junto con el resto del plan.
- **Vincular actividad:** cada ticket que comparta el usuario para el pase (`AMPMX-*` / `SPDI-*`) se vincula al CDA con el tipo `Discovery - Connected` (el ticket *connects to* el CDA). Solo se agregan los que falten.
- **Editar un CDA existente:** si el usuario indica un `CDA-XXXXX`, se trabaja sobre ese ticket (no se crea otro), tomando sus campos como base.

---

## 6. Descripción del CDA

Se usa el **formato general** de `ai-project` (`specs/templates/cda-template.md`): tablas Recursos, Tickets y Aprobaciones, sin ajustes de estructura. Este proyecto solo define los valores:

| Dato de la descripción | Valor en Artico MX |
| --- | --- |
| Recurso y Deploy (Tabla 1) | Los de la sección 2, copiados literal |
| Rama (Tabla 1) | `release/CDA-XXXXX` |
| Pull Request (Tabla 1) | PR `release/CDA-XXXXX → <rama productiva>` de cada repo (o `pendiente (manual)` si lo tiene que crear la persona correspondiente) |
| Versión / Rollback (Tabla 1) | Sección 4; Liquibase `-` / `-` |
| Tickets (Tabla 2) | `AMPMX-*` / `SPDI-*`, link `https://grupoavla.atlassian.net/browse/<TICKET>` |
| Pull Request (Tabla 2) | PRs `feature/<TICKET> → feature/CDA-XXXXX` del ticket, en todos los repos |
| Aprobadores (Tabla 3) | `@Juan Carlos Venegas` |
| Dev (Tabla 2) / DEVs (Tabla 3) | Persona asignada de cada ticket más los autores de sus PRs; DEVs sin repetidos |
| QAs (Tabla 3) | Los tickets AMPMX no tienen campo de QA: proponer los que aparezcan en el ticket (comentarios o historial) y **confirmar siempre con el usuario** |

Ejemplo de la Tabla 1 con estos valores:

```markdown
| **Recurso** | **Rama** | **Pull Request** | **Versión** | **Rollback** | **Deploy** |
| --- | --- | --- | --- | --- | --- |
| artico-frontend | release/CDA-XXXXX | [artico-frontend: 2900](<url PR de pase>) | 1.87.0 | 1.86.0 | [Action](https://github.com/avla-tech/artico-frontend/actions/workflows/prod-build-and-deploy.yaml) |
| artico-mx-liquibase | release/CDA-XXXXX | [artico-mx-liquibase: 500](<url PR de pase>) | - | - | [Action](https://github.com/avla-tech/artico-mx-liquibase/actions/workflows/run-liquibase-prod.yml) |
```
~~~~~


---

## Fase 6 — Verificación de paridad

La tarea **no** está terminada hasta que todo esto dé ✅. Informá el resultado ítem por ítem.

### 6.1 Verificaciones mecánicas

- [ ] Los 8 archivos de la Fase 3 existen y su contenido coincide con esta guía (salvo las adaptaciones informadas). Comprobalo comparando, no de memoria.
- [ ] El frontmatter YAML de cada archivo se parsea: el agente tiene `name`, `description`, `tools` y `skills` (lista con `versiones`, `jira-cda`, `git-pase`, `descripcion-cda`, `validacion-pase`); cada skill tiene `name` igual al de su carpeta, `description` y `user-invocable: false`; el comando tiene `description` y `argument-hint`.
- [ ] Claude Code lista las 5 skills y el comando `/pase` (aparecen como disponibles en la sesión).
- [ ] Toda referencia entre archivos resuelve: cada skill citada existe, `specs/templates/cda-template.md` existe, y las secciones del README citadas existen con ese nombre.
- [ ] Los dos diagramas Mermaid de la sección del README renderizan sin error (por ejemplo con `npx -y @mermaid-js/mermaid-cli -i <archivo>.mmd -o out.svg`).

### 6.2 Flujo (el agente debe hacer esto, en este orden)

- [ ] Identificar proyecto → leer README → leer `doc/IA` (solo de los repos del pase) + formato general → obtener reglas.
- [ ] Determinar el modo: **Crear** o **Editar** (si el usuario menciona un `CDA-XXXXX`).
- [ ] ¿Información completa? No → preguntar (de a una) y volver a validar.
- [ ] Analizar tickets → Devs / QAs / ramas / PRs.
- [ ] P2: el usuario elige Layers y aprueba el plan.
- [ ] Crear CDA (solo modo Crear) → obtener el número real.
- [ ] Crear o reutilizar `feature/CDA-XXXXX` → actualizar con producción.
- [ ] Intentar crear o reutilizar `release/CDA-XXXXX` desde la rama productiva. Sin permiso → parada *Acción manual: rama release* (la persona correspondiente crea la rama y el PR de pase a mano).
- [ ] Versiones: sin versión → `-`; con versión → versión productiva → Release `X.(Y+1).0` / Hotfix `X.Y.(Z+1)` → `version-tag` → **push explícito del tag**.
- [ ] PRs de tickets → descripción → campos de Jira → **Vincular actividad** → PR `feature/CDA-XXXXX` → `release/CDA-XXXXX` → PR de pase `release/CDA-XXXXX` → rama productiva (o la URL del PR manual, verificada).
- [ ] Validar Jira, Git, versiones y descripción → resumen final. Con cualquier ❌: detenerse e informar.

### 6.3 Comportamientos obligatorios

Comprobá que cada uno esté escrito en el agente o en la skill indicada:

| # | Comportamiento | Dónde |
| --- | --- | --- |
| 1 | Prioridad: usuario → documentación del proyecto → skills + formato general → reglas del agente → ejemplo CDA-14643 (no se consulta en ejecución) | Agente |
| 2 | Estructura general, valores del proyecto; nunca tomar valores de otro proyecto ni del ticket de ejemplo | Agente, `jira-cda`, `descripcion-cda`, template |
| 3 | Preguntas **de a una**: una pregunta por parada P1, con "Pregunta N de M"; en campos de selección, opciones reales de Jira | Agente, comando |
| 4 | Paradas P1 (faltantes), P2 (Layers + aprobación del plan; nada se escribe antes), P3 (errores) con el bloque `⏸ Pase detenido` | Agente |
| 5 | El comando retoma **el mismo agente** con SendMessage y no responde por el usuario | Comando |
| 6 | Layers nunca automáticos; en modo Editar se muestran los actuales para mantenerlos o cambiarlos | Agente, `jira-cda` |
| 7 | Modo Editar: nunca crear otro CDA; precargar datos del ticket; P3 si el CDA no coincide con el proyecto o está en estado final; plan como `actual → nuevo`; reutilizar ramas, versiones y PRs | Agente, `jira-cda`, `versiones`, `descripcion-cda` |
| 8 | Pase de un solo repo: los recursos del proyecto son un catálogo; los repos no incluidos no se leen ni se modifican ni aparecen en el CDA | Agente, reglas del proyecto |
| 9 | Vincular actividad: cada ticket compartido por el usuario, sin duplicar ni quitar links; ticket en `inwardIssue` y CDA en `outwardIssue`; crear uno, verificar la dirección y recién después el resto | `jira-cda`, `validacion-pase` |
| 10 | `version-tag` solo sobre `feature/CDA-XXXXX`, nunca sobre ramas productivas; working tree limpio (incluidos archivos sin trackear, porque el script hace `git add .`); tag inexistente antes de aplicar | `versiones`, `git-pase` |
| 11 | Después de `version-tag`: `git push origin <tag>` y verificar con `git ls-remote --tags` (el tag local no alcanza) | `versiones`, `validacion-pase` |
| 12 | Nunca: force push, rebase de ramas compartidas, commits sobre ramas productivas, merge o aprobación de PRs | `git-pase`, agente |
| 13 | Nunca afirmar una operación sin confirmación de la herramienta; nunca inventar CDA, PRs, versiones, personas ni fechas (`pendiente` + `faltantes`) | Agente, `descripcion-cda`, `validacion-pase` |
| 14 | Bitbucket sin credenciales: link de creación manual + pedir la URL y verificarla | `git-pase` |
| 15 | QAs siempre confirmados por el usuario; DEVs = asignado + autores de PRs, sin repetidos; menciones con `accountId` | `descripcion-cda`, reglas del proyecto |
| 16 | Descripción en ADF con 3 tablas; columna Deploy copiada literal de las reglas del proyecto (o la respuesta del usuario) | `descripcion-cda` |
| 17 | PR de pase siempre desde `release/CDA-XXXXX` (creada desde la rama productiva) hacia `master`/`main` o la productiva del proyecto; Tabla 1 con *Rama* = `release/CDA-XXXXX` y *Pull Request* = ese PR | `git-pase`, `descripcion-cda`, template, reglas del proyecto |
| 18 | Sin permiso para crear `release/CDA-XXXXX`: no reintentar ni usar otra vía; avisar al usuario para que la persona correspondiente cree la rama y el PR de pase a mano; verificar la URL que pegue o dejar `pendiente (manual)` (⚠️) | `git-pase`, agente, comando, `validacion-pase` |

### 6.4 Prueba en seco (sin escribir en Jira ni en Git)

Invocá `/pase` con un pedido de prueba (proyecto real, tipo, un ticket) y cortá en la parada **P2**. Verificá que:

- [ ] Pregunte de a una lo que falta.
- [ ] Liste los Layers reales de Jira y no elija ninguno.
- [ ] El plan incluya la advertencia de push (ramas, `version-tag` y tag), las ramas `feature/CDA-XXXXX` y `release/CDA-XXXXX` (con la aclaración de que la release puede quedar como acción manual), los PRs y los tickets a vincular.
- [ ] No haya creado ni editado nada (ni CDA, ni ramas, ni PRs).

Después respondé "no apruebo" y confirmá que el agente se detiene sin ejecutar nada.

### 6.5 Resumen final

Informá: archivos creados, archivos modificados, adaptaciones aplicadas (con el motivo), resultado de cada ítem de la Fase 6 y lo que quedó pendiente (por ejemplo, el MCP de Atlassian sin conectar o proyectos sin archivo de reglas).

---

## Anexo — Por qué el agente es así

Decisiones y ajustes acumulados en `ai-project`. Ya están incorporados en los archivos de la Fase 3; se listan para que no se "simplifiquen" por error.

| Ajuste | Motivo |
| --- | --- |
| Agente orquestador + 5 skills | Evitar un agente monolítico: cada skill es la única dueña de su tema |
| Flujo de ramas: tickets → `feature/CDA-XXXXX` → `release/CDA-XXXXX` → rama productiva | Decisión del equipo: el PR de pase sale de una rama `release/CDA-XXXXX` creada desde la productiva, y el contenido entra por el PR `feature/CDA-XXXXX → release/CDA-XXXXX` (así funciona aunque los PRs de tickets sigan abiertos). Reemplaza al flujo anterior, que iba de `feature/CDA-XXXXX` directo a la productiva |
| Sin permiso para `release/*` → acción manual | En muchos repos las ramas `release/*` están protegidas. El agente no busca alternativas: avisa para que la persona con permisos cree la rama y el PR de pase |
| Defaults de Artico MX tomados del ticket real (`Artico MP MX`, `Juan Carlos Venegas Zurita`) | Son los valores que usa Jira en los CDAs históricos |
| Los dos repos de Liquibase incluidos en el catálogo, sin versión (`-`) | Aparecen en los pases reales; su rama productiva es `master` |
| Columna Deploy fija por recurso | Los links de CDA-14643 se usan siempre, sin recalcularlos |
| Pase de un solo repo | Los proyectos se pasan por separado; el agente no debe tocar repos que no estén en el pase |
| Modo Editar | Trabajar sobre un CDA existente sin crear otro |
| Vincular actividad con los tickets del usuario | Trazabilidad ticket ↔ CDA en Jira |
| Formato general en el framework, valores en cada proyecto, preguntas de a una | Que cualquier proyecto pueda hacer pases aunque no tenga reglas propias |
| Working tree limpio antes de `version-tag` | El script hace `git add .` y se llevaría archivos ajenos al commit de versión |
| Push explícito del tag | En la prueba con CDA-1 el tag quedó solo en local: el script crea un tag liviano y `--follow-tags` no lo sube |
| Dirección de los links (`inwardIssue` = ticket) | En la prueba con CDA-1 los links quedaron invertidos y el MCP no tiene una tool para borrarlos |
| Git con la misma cuenta que `gh` (`gh auth setup-git`) | Con credenciales distintas, `gh` crea PRs pero git no puede pushear |
