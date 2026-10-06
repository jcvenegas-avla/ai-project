# vectorstore (server MCP)

Server MCP stdio que expone dos tools a los agentes `product-owner`, `tech-lead` y `soporte`:

- `search_similar`: busca entregables anteriores semánticamente similares (ranking, no veredicto de duplicado).
- `save_deliverable`: guarda un entregable recién producido, embebido para búsquedas futuras.

Embeddings locales con `Xenova/multilingual-e5-small` (384 dim, sin API key). Persistencia en Postgres con la extensión `pgvector`.

## Puesta en marcha

1. `npm install` en la raíz del repo.
2. Aplicar el esquema una vez: `psql "$DATABASE_URL" -f mcp/vectorstore/schema.sql`.
3. Exportar `DATABASE_URL` en el entorno desde el que se lanza Claude Code (el server lo lee de `process.env`).
4. `.mcp.json` ya lo registra como `node mcp/vectorstore/server.js`.

Opcional: `TRANSFORMERS_CACHE_DIR` para cambiar el directorio de cache del modelo (default `./.cache/transformers`). El primer arranque descarga el modelo desde Hugging Face.
