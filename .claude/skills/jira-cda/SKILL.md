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
