import { pipeline, env } from "@xenova/transformers";

env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR ?? "./.cache/transformers";

const MODEL_NAME = "Xenova/multilingual-e5-small";

let extractorPromise = null;

function getExtractor() {
  extractorPromise ??= pipeline("feature-extraction", MODEL_NAME);
  return extractorPromise;
}

/**
 * Embeddings locales (sin API key, sin proveedor externo) vía `@xenova/transformers`
 * (ONNX/WASM, corre en el mismo proceso Node). Modelo `Xenova/multilingual-e5-small`
 * (384 dim) — elegido por buen desempeño en español.
 *
 * E5 es asimétrico: el texto que se busca usa el prefijo "query: " y el texto que se
 * guarda como documento usa "passage: ". `kind` decide cuál se antepone.
 *
 * Limitación conocida y aceptada: el backbone trunca ~512 tokens — un documento largo se
 * embebe solo por su comienzo, aunque el texto completo se siga guardando aparte.
 *
 * Las similaridades coseno de este modelo vienen en una banda alta y comprimida (ej. 0.87
 * para textos sin relación, 0.93 para el mismo incidente redactado distinto). El score
 * absoluto NO sirve como umbral fijo de "es un duplicado"; lo único confiable es el ORDEN
 * relativo entre resultados.
 *
 * @param {string} text
 * @param {"query" | "passage"} kind
 * @returns {Promise<number[]>}
 */
export async function embedText(text, kind) {
  const extractor = await getExtractor();
  const output = await extractor(`${kind}: ${text}`, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
