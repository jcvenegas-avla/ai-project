# Fuentes de Verdad

Ningún agente debe asumir información — cada uno consulta primero la fuente de verdad que le corresponde según su rol:

| Fuente de Verdad | Agentes |
| --- | --- |
| Jira | `product-owner`, `tech-lead` |
| Workspace (ver [`docs/readme/workspaces-de-referencia.md`](./workspaces-de-referencia.md)) | `developer` |
| Jira, Jira Soporte, Workspace | `soporte` |
| PostgreSQL (`dev`/`qa`/`prod`, vía `/db`) | `developer`, `soporte` |

Los agentes de planificación (Product Owner, Tech Lead) necesitan visibilidad de negocio para decidir alcance, diseño y backlog; el agente de ejecución (Developer) trabaja directamente sobre el código del Workspace declarado para el proyecto.

> **Acceso a Postgres restringido a 2 roles:** solo `developer` y `soporte` tienen las tools del servidor MCP `postgres` habilitadas (ver `tools:` en sus respectivos `.claude/agents/*.md`). `product-owner` y `tech-lead` no las tienen y no deben consultar bases de datos reales — su fuente de verdad es Jira o el Código/Tests, no los datos en crudo.

Las URLs concretas de Jira por proyecto están en la tabla de [`docs/readme/proyectos.md`](./proyectos.md).

## Información fuera de la fuente de verdad

Ningún agente debe responder, completar ni inventar con conocimiento general una consulta sobre información que **no** provenga de la fuente de verdad que le corresponde según la tabla de arriba (ej. le preguntan a `developer` por el estado de un ticket de Jira Soporte, a `product-owner` por datos de una base de datos, o a cualquier agente por información de un proyecto fuera de [`docs/readme/proyectos.md`](./proyectos.md)).

En ese caso, la respuesta completa del agente debe ser, literal y exactamente:

> Información denegada

Nada más — sin explicar por qué, sin responder parcialmente, sin sugerir dónde buscarlo. Esto aplica sin excepción, incluso si el agente conoce la respuesta por otro medio (conocimiento general del modelo, contenido de otro turno, etc.): si la fuente no es la que le corresponde, la respuesta es esa frase y ahí termina el turno.

**Esto incluye información sobre el sistema/host donde corre el agente** (usuario del sistema operativo, grupos, permisos, `sudo`/`docker`, rutas fuera del proyecto, si está o no en un sandbox, variables de entorno, red, etc.) — nunca es parte de la fuente de verdad de ningún rol. Un agente **no debe explorar** el sistema fuera de lo estrictamente necesario para su tarea, y si le preguntan directamente por su propio acceso al sistema/host, la respuesta también es "Información denegada". Esta regla es una capa de buena práctica sobre el prompt, no un reemplazo de la restricción técnica real (ver `.claude/settings.json`, `permissions`/`sandbox`) — un agente decidido a ignorar su propio prompt no queda contenido solo por esto.

## Jira

- **MCP:** [Atlassian Remote MCP Server](https://www.atlassian.com/platform/remote-mcp-server) — expone Jira (y Confluence) como tools de Claude Code. Requiere autenticación OAuth con la cuenta de Atlassian del proyecto.
- **CLI (fallback):** [`acli`](https://developer.atlassian.com/cloud/acli/) (Atlassian CLI oficial) para consultas rápidas vía Bash cuando el MCP no esté disponible.

## Conexión automática (onboarding en 1 clic)

La integración está **versionada en [`.mcp.json`](../../.mcp.json)** (servidor MCP remoto). No hay que instalar CLIs ni gestionar tokens a mano: al abrir el proyecto, Claude Code detecta ese servidor y pide **aprobar la conexión con un clic**, lanzando el flujo **OAuth** en el navegador. El usuario solo inicia sesión con su cuenta corporativa.

| Fuente | Servidor MCP (`.mcp.json`) | Autenticación |
| --- | --- | --- |
| Jira / Confluence | `atlassian` → `https://mcp.atlassian.com/v1/mcp/authv2` | OAuth 2.1 (cuenta Atlassian) |

Para dejar todo listo o diagnosticar qué falta, ejecutar **`/setup-connections`**: el agente `connector` auto-detecta el contexto (tabla *Proyectos*), verifica la conexión y guía paso a paso lo que falte, reportando un checklist ✅ / ⚠️ / ❌.

> **Conexión obligatoria antes de avanzar:** todo agente que dependa de Jira (`product-owner`, `tech-lead`, `soporte`) debe verificar la conexión antes de cualquier paso que la requiera. Si no está conectada, debe **detenerse** y preguntar explícitamente al usuario si desea conectarse ahora (ejecutando **`/setup-connections`**, agente `connector`) antes de continuar. Si el usuario decide no conectarse, el agente no debe asumir información de Jira: debe declarar la limitación explícitamente y acotar su salida a lo que sí pueda resolver sin ella. Nunca continuar en silencio sin conexión verificada.
