-- Esquema del server MCP vectorstore (ver mcp/vectorstore/README.md). Idempotente: se puede
-- aplicar sobre una base que ya tenga la tabla (creada antes por las migraciones de la API).
--   psql "$DATABASE_URL" -f mcp/vectorstore/schema.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Entregables finales de los agentes de planificación (soporte: plan de incidencia +
-- borrador de ticket SPDI; product-owner: requirements.md; tech-lead: design.md/backlog),
-- embebidos para poder buscar semánticamente "¿esto ya se hizo antes?".
CREATE TABLE IF NOT EXISTS sdd_deliverables (
  deliverable_id TEXT PRIMARY KEY,
  role           TEXT NOT NULL,
  slug           TEXT NOT NULL,
  session_id     TEXT,
  title          TEXT,
  content        TEXT NOT NULL,
  -- Dimensión fija de Xenova/multilingual-e5-small (ver embed-text.js).
  embedding      vector(384) NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sdd_deliverables_role_idx ON sdd_deliverables (role, created_at DESC);

CREATE INDEX IF NOT EXISTS sdd_deliverables_embedding_hnsw_idx ON sdd_deliverables
  USING hnsw (embedding vector_cosine_ops);
