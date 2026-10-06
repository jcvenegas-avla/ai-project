import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PostgresDeliverableRepository } from "./deliverable-repository.js";
import { embedText } from "./embed-text.js";
import { handleSearchSimilar, handleSaveDeliverable } from "./handlers.js";

// Solo console.error acá: en un server MCP stdio, stdout ES el protocolo — cualquier línea
// que no sea un frame JSON-RPC lo corrompe.

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL no está definida — el server vectorstore no puede arrancar.");
  process.exit(1);
}

const deps = {
  repo: new PostgresDeliverableRepository(databaseUrl),
  embedFn: embedText,
};

const server = new McpServer({ name: "vectorstore", version: "0.1.0" });

const ROLE_SCHEMA = z.enum(["soporte", "product-owner", "tech-lead"]);

server.tool(
  "search_similar",
  "Busca entregables (planes de soporte, requirements.md, design.md/backlog) semánticamente similares ya guardados, para detectar si algo parecido ya se hizo antes. Devuelve un ranking, no un veredicto de duplicado — juzgá relevancia por el contenido de cada resultado.",
  {
    query_text: z.string().min(1),
    role: ROLE_SCHEMA.optional(),
    limit: z.coerce.number().int().positive().max(20).default(5),
  },
  (input) => handleSearchSimilar(deps, input),
);

server.tool(
  "save_deliverable",
  "Guarda el texto completo de un entregable recién producido (plan de soporte, requirements.md, design.md/backlog), embebiéndolo para que búsquedas futuras lo puedan encontrar.",
  {
    role: ROLE_SCHEMA,
    slug: z.string().min(1),
    content: z.string().min(1),
    session_id: z.string().optional(),
    title: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  },
  (input) => handleSaveDeliverable(deps, input),
);

await server.connect(new StdioServerTransport());
console.error("vectorstore mcp server started");
