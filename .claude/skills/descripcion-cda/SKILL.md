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
