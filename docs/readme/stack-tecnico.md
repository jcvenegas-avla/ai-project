# Stack Técnico

Este repositorio no contiene código de aplicación: es el framework SDD (agentes, comandos, specs y documentación). Lo único ejecutable son los servidores MCP locales declarados en `.mcp.json`:

- **`postgres`** — `mcp-postgres-multi` (dependencia npm), configurado con `mcp-postgres.config.json` (ver [`docs/integraciones/database-access.md`](../integraciones/database-access.md)).
- **`vectorstore`** — server propio en [`mcp/vectorstore/`](../../mcp/vectorstore/README.md) (Node.js ESM, embeddings locales + Postgres con `pgvector`).
- **`atlassian`** — remoto (HTTP), sin instalación local.

Requisitos: Node.js 18+.

```bash
npm install                                          # dependencias de los servidores MCP
psql "$DATABASE_URL" -f mcp/vectorstore/schema.sql   # esquema del vectorstore (una vez)
```

> El server `vectorstore` lee `DATABASE_URL` del entorno desde el que se lanza Claude Code.
