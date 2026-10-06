# Proyectos

Lista cerrada de proyectos permitidos y sus fuentes de contexto correspondientes. Ningún agente debe operar sobre un proyecto que no esté en esta tabla sin confirmarlo antes con el usuario.

> Si un proyecto no tiene un schema Postgres para el entorno que se necesita, o la celda está vacía, el agente **debe detenerse**, ejecutar `pg_list_schemas` contra ese entorno y preguntar al usuario cuál schema corresponde antes de consultar cualquier tabla — nunca asumir `public` por defecto salvo que ya esté confirmado en esta tabla. Una vez confirmado, documentarlo aquí para no repetir la pregunta. Detalle completo en [`docs/integraciones/database-access.md`](../integraciones/database-access.md).
>
> Estructura completa de tablas/columnas/PK/FK del schema `public` (snapshot): vive en el repositorio de cada proyecto (`doc/IA/db-schema-*.md`), no en `ai-project` — ver [`docs/integraciones/database-access.md`](../integraciones/database-access.md) sección "Estructura de tablas (snapshot)".

# Artico México

| Característica | Detalle |
| --- | --- |
| Workspace | [`artico-mx.code-workspace`](../../workspace/artico-mx.code-workspace) |
| Principal Branch | Definida por repositorio — ver el atributo `principal-branch` de cada entrada en `artico-mx.code-workspace` |
| Jira | [AMPMX](https://grupoavla.atlassian.net/jira/software/projects/AMPMX/boards/1264) |
| Jira Soporte | [SPDI](https://grupoavla.atlassian.net/jira/software/c/projects/SPDI/boards/102) |
| País | `MX` |
| Filtros JQL de Soporte | `project = SPDI AND type = "Incident Support" AND "negocio-país[checkboxes]" = México AND "sistema/plataforma responsable[checkboxes]" IN (Ártico, "Artico MP")` |
| Schemas Postgres DEV | `public` |
| Schemas Postgres QA | `public` |
| Schemas Postgres PROD | `public` |

# Canales Onboarding GT USA

| Característica | Detalle |
| --- | --- |
| Workspace | [`canales-onboarding-gt-usa.code-workspace`](../../workspace/canales-onboarding-gt-usa.code-workspace) |
| Principal Branch | Definida por repositorio — ver el atributo `principal-branch` de cada entrada en `canales-onboarding-gt-usa.code-workspace` |
| Jira | [USA](https://grupoavla.atlassian.net/jira/software/projects/USA) |
| Jira Soporte | [SPDI](https://grupoavla.atlassian.net/jira/software/c/projects/SPDI/boards/102) |
| País | `US` |
| Filtros JQL de Soporte | `project = SPDI AND type = "Incident Support" AND "negocio-país[checkboxes]" = "Estados Unidos" AND "sistema/plataforma responsable[checkboxes]" IN (Amaru, Onboarding)` |
| Schemas Postgres DEV | `onboarding_gt_usa_dev` |
| Schemas Postgres QA | `onboarding_gt_usa_qa` |
| Schemas Postgres PROD | `onboarding_gt_usa_prod` |

# Onboarding P&C México

| Característica | Detalle |
| --- | --- |
| Workspace | [`onboarding-pandc-mx.code-workspace`](../../workspace/onboarding-pandc-mx.code-workspace) |
| Principal Branch | Definida por repositorio — ver el atributo `principal-branch` de cada entrada en `onboarding-pandc-mx.code-workspace` |
| Jira | [OPCMX](https://grupoavla.atlassian.net/jira/software/projects/OPCMX/boards/1231) |
| Jira Soporte | [SPDI](https://grupoavla.atlassian.net/jira/software/c/projects/SPDI/boards/102) |
| País | `MX` |
| Filtros JQL de Soporte | `project = SPDI AND type = "Incident Support" AND "negocio-país[checkboxes]" = México AND "sistema/plataforma responsable[checkboxes]" = "Onboarding P&C"` |
| Schemas Postgres DEV | `api_onboarding_pc_dev` |
| Schemas Postgres QA | `api_onboarding_pc_qa` |
| Schemas Postgres PROD | `api_onboarding_pc_prod` |
