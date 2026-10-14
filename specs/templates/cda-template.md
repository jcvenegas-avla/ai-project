# CDA (Pase de Producción)

Formato general del ticket CDA para cualquier proyecto, derivado de `CDA-14643` (ese ticket no se consulta en ejecución). Lo usa el agente `pase-produccion` (skills `jira-cda` y `descripcion-cda`).

- **Estructura (este archivo):** general, igual para todos los proyectos.
- **Valores:** responsabilidad de cada proyecto (`doc/IA/pase-produccion.md`, ver `docs/readme/agente-de-pases-de-produccion.md`, *Reglas de Pase por Proyecto*). Incluye las opciones predefinidas de selección, los valores que se autocompletan (defaults, links de Deploy, nombres de recursos, personas), las ramas y el versionado.
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
