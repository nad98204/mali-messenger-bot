import { RAG_DATA } from "./rag-data.js";

function chunkSection(key, text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0];
  const bullets = lines.slice(1);
  const chunks = [];

  for (let index = 0; index < bullets.length; index += 2) {
    const chunkIndex = chunks.length;
    const chunkText = [title, ...bullets.slice(index, index + 2)].join("\n");

    chunks.push({
      id: `rag:${key}:${chunkIndex}`,
      text: chunkText,
      metadata: {
        sourceKey: key,
        title,
        chunkIndex,
        text: chunkText,
      },
    });
  }

  return chunks;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "GET" || url.pathname !== "/seed") {
      return new Response("Not found", { status: 404 });
    }

    const chunks = [
      ...chunkSection("buoi1", RAG_DATA.buoi1),
      ...chunkSection("buoi2", RAG_DATA.buoi2),
    ];
    const seeded = [];

    for (const chunk of chunks) {
      const embedding = await env.AI.run("@cf/baai/bge-m3", { text: [chunk.text] });
      const values = embedding.data?.[0];

      if (!Array.isArray(values)) {
        throw new Error(`Missing embedding for ${chunk.id}`);
      }

      await env.RAG_INDEX.upsert([
        {
          id: chunk.id,
          values,
          metadata: chunk.metadata,
        },
      ]);

      seeded.push({
        id: chunk.id,
        preview: chunk.text.slice(0, 120),
      });
    }

    return Response.json({ seeded });
  },
};
