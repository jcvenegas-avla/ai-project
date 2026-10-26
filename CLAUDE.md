# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repositorio

Framework de **Spec Driven Development (SDD)**: agentes, comandos, skills, plantillas de specs y documentación. **No contiene código de aplicación.** El código de cada proyecto vive en repos aparte, clonados dentro de `workspace/`. `README.md` es solo un índice: cada sección está en `docs/readme/<sección>.md`.

Lo único ejecutable son los servidores MCP locales declarados en `.mcp.json`:

- `postgres`: `mcp-postgres-multi` (npm), con las credenciales en `mcp-postgres.config.json` (local, en `.gitignore`). Conexiones `dev`, `qa` y `prod`.
- `vectorstore`: server propio en `mcp/vectorstore/` (Node ESM, embeddings locales + Postgres `pgvector`). Lee `DATABASE_URL` del entorno.
- `atlassian`: remoto (HTTP + OAuth), para Jira y Confluence.

```bash
npm install                                          # dependencias de los MCP (Node 18+)
psql "$DATABASE_URL" -f mcp/vectorstore/schema.sql   # esquema del vectorstore (una vez)
```

No hay build, lint ni tests en este repo. Los de cada proyecto están en su propio repo dentro de `workspace/`.

## Arquitectura

- **Comando → agente.** Cada `.claude/commands/<cmd>.md` se limita a invocar al subagente de `.claude/agents/<agente>.md` y a reenviar al usuario sus pausas. La lógica y las reglas están en el agente; el comando solo orquesta. Los agentes con mucha lógica la delegan en skills (`.claude/skills/`; por ejemplo, `pase-produccion` usa `versiones`, `jira-cda`, `git-pase`, `descripcion-cda` y `validacion-pase`).
- **Pipeline SDD** (cada etapa se lanza a mano, no hay orquestador): `/create-spec` (product-owner) → `/create-jira` (tech-lead) → `/implement` (developer) → `/release`. Los flujos `/soporte`, `/pase` y `/reversa` son independientes de ese pipeline.
- **Registro de proyectos:** `docs/readme/proyectos.md` tiene una tabla por proyecto con Workspace, Jira, Jira Soporte (SPDI + filtros JQL), país y schemas Postgres por entorno. Todos los agentes la consultan para saber sobre qué operan. Para registrar uno nuevo se usa `/add-project`.
- **Workspaces:** `workspace/<proyecto>.code-workspace` (versionado) declara los repos del proyecto. Cada carpeta lleva `repo` (URL git) y `principal-branch`. Los repos se clonan en `workspace/<CARPETA>/<repo>` (p. ej. `workspace/KAMUI/kamui-backend`) y están en el `.gitignore` (`workspace/*/`).
- **Fuentes de verdad por rol** (`docs/readme/fuentes-de-verdad.md`): cada agente solo consulta las fuentes que le corresponden. Si le preguntan por algo fuera de ellas, o por el sistema o host, su respuesta es literalmente `Información denegada`. Solo `developer`, `soporte` y `reversa-movimientos` tienen herramientas de Postgres.
- **Plantillas** en `specs/templates/` (requirements, epic, story, task, subtask, CDA). Convenciones de Jira y de nombres en `specs/jira-workflow.md` y `specs/naming-conventions.md`.
- **Reglas de soporte por proyecto** en `docs/soporte/<proyecto>/`. Hoy solo existe `kamui-mx/agente-de-reversa-de-movimientos.md`, con tablas, estados, mapeo de `codDocument`, queries y uso de JMeter para `/reversa`.

## Reglas que no se deducen del código

- **BDD solo lectura, sin excepciones:** nunca `INSERT`/`UPDATE`/`DELETE`/DDL en ningún entorno, aunque el usuario lo pida. Se le entrega la query para que la ejecute él. Si no se indicó el entorno (`dev`/`qa`/`prod`), preguntar; no hay entorno por defecto. Tampoco asumir el schema: tomarlo de `proyectos.md` o preguntar.
- **Jira:** los agentes que dependen de Jira verifican antes la conexión. Si no hay conexión, se detienen y ofrecen `/setup-connections`.
- **Pausas de los agentes:** cuando un agente devuelve un bloque `⏸ ... detenida`, el comando se lo muestra al usuario tal cual y retoma **el mismo agente** (SendMessage) con la respuesta literal. Nunca se responde en nombre del usuario, y las confirmaciones de envío o creación tienen que ser explícitas.
- **`/reversa` (Kamui MX):** se envía con `jmeter/kamui-mx/SendEvents.jmx` + `sendEvents.csv` y se fuerza con `ForceEvents.jmx` + `idEvent.csv`. No cambiar qué samplers están habilitados. JMeter y el JDK no se versionan: se instalan en `jmeter/apache-jmeter-5.4.3` y `jmeter/jdk-17` con `bash scripts/setup-jmeter.sh` (en el `.gitignore`). Los `.jmx` se versionan sin token: el Bearer caduca (401/403) y se pega en local antes de cada uso. Las salidas se guardan en `.cache/reversas/<SPDI>/`.

## Entorno

- Sandbox activo (`.claude/settings.json`): no se puede leer `/etc` ni `$HOME`. Por eso `curl` falla con el error 77 (no encuentra el bundle de CA). La salida a internet va por un proxy, con un allowlist de dominios.
- El perfil de shell del usuario imprime líneas de `gnome-gamma-tool` / `tput` en cada comando. Es ruido: ignorarlas.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
