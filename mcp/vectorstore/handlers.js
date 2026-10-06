import { randomUUID } from "node:crypto";

const EXCERPT_LENGTH = 300;

/** Funciones planas (no inline en `server.tool()`) para poder probarlas sin transporte stdio real. */
export async function handleSearchSimilar(deps, input) {
  const embedding = await deps.embedFn(input.query_text, "query");
  const matches = await deps.repo.findSimilar(embedding, { role: input.role, limit: input.limit ?? 5 });

  if (matches.length === 0) {
    return { content: [{ type: "text", text: "No se encontraron resultados similares." }] };
  }

  // El score es relativo (ver embed-text.js) — nunca se presenta como un umbral fijo de
  // "esto ya es un duplicado", queda a criterio de quien lee el resultado.
  const lines = matches.map(({ deliverable, similarity }) => {
    const pct = (similarity * 100).toFixed(1);
    const excerpt = deliverable.content.slice(0, EXCERPT_LENGTH).replace(/\s+/g, " ").trim();
    const truncated = deliverable.content.length > EXCERPT_LENGTH ? "…" : "";
    return `- [${pct}%] ${deliverable.role}/${deliverable.slug} (${deliverable.createdAt})\n  ${excerpt}${truncated}`;
  });

  return {
    content: [
      {
        type: "text",
        text:
          `${matches.length} resultado(s) similar(es) (orden por similaridad — no es un corte fijo de "duplicado", juzgá relevancia por el contenido):\n\n` +
          lines.join("\n\n"),
      },
    ],
  };
}

export async function handleSaveDeliverable(deps, input) {
  const embedding = await deps.embedFn(input.content, "passage");
  const deliverableId = `dlv_${randomUUID()}`;

  await deps.repo.save({
    deliverableId,
    role: input.role,
    slug: input.slug,
    sessionId: input.session_id ?? null,
    title: input.title ?? null,
    content: input.content,
    embedding,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });

  return { content: [{ type: "text", text: `Guardado ${deliverableId}.` }] };
}
