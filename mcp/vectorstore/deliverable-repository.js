import pg from "pg";

/** `number[]` -> literal de texto pgvector (`[0.1,0.2,...]`). */
function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

function toDomain(row) {
  return {
    deliverableId: row.deliverable_id,
    role: row.role,
    slug: row.slug,
    sessionId: row.session_id,
    title: row.title,
    content: row.content,
    // node-postgres devuelve `vector` como texto crudo — formato pgvector `[0.1,...]` (JSON válido).
    embedding: JSON.parse(row.embedding),
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresDeliverableRepository {
  constructor(connectionString) {
    this.pool = new pg.Pool({ connectionString });
  }

  async save(deliverable) {
    await this.pool.query(
      `INSERT INTO sdd_deliverables
         (deliverable_id, role, slug, session_id, title, content, embedding, metadata, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::vector,$8,$9)`,
      [
        deliverable.deliverableId,
        deliverable.role,
        deliverable.slug,
        deliverable.sessionId,
        deliverable.title,
        deliverable.content,
        toVectorLiteral(deliverable.embedding),
        JSON.stringify(deliverable.metadata),
        deliverable.createdAt,
      ],
    );
  }

  /** Ordenados por similaridad descendente — operador `<=>` (distancia coseno), misma opclass que el índice HNSW. */
  async findSimilar(embedding, { role, limit = 5 } = {}) {
    const result = await this.pool.query(
      `SELECT deliverable_id, role, slug, session_id, title, content, embedding, metadata, created_at,
              1 - (embedding <=> $1::vector) AS similarity
         FROM sdd_deliverables
        WHERE ($2::text IS NULL OR role = $2)
        ORDER BY embedding <=> $1::vector
        LIMIT $3`,
      [toVectorLiteral(embedding), role ?? null, limit],
    );
    return result.rows.map((row) => ({ deliverable: toDomain(row), similarity: Number(row.similarity) }));
  }
}
