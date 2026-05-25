import { RAG_DATA } from "./rag-data.js";

const LEGACY_SOURCE_KEYS = [
  "buoi1",
  "buoi2",
  "khoaChuyenSauTongQuan",
  "khoaChuyenSauDoiTuong",
  "khoaChuyenSauLoTrinh",
  "khoaChuyenSauKhacBiet",
  "khoaChuyenSauQuyenLoi",
  "khoaChuyenSauTuVan",
];

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
      ...chunkSection("khoiThongDongTienTongQuan", RAG_DATA.khoiThongDongTienTongQuan),
      ...chunkSection("khoiThongDongTienNhanDienTacNghe", RAG_DATA.khoiThongDongTienNhanDienTacNghe),
      ...chunkSection("khoiThongDongTienChuaLanh", RAG_DATA.khoiThongDongTienChuaLanh),
      ...chunkSection("khoiThongDongTienDuDay", RAG_DATA.khoiThongDongTienDuDay),
      ...chunkSection("khoiThongDongTienLuatHapDan", RAG_DATA.khoiThongDongTienLuatHapDan),
      ...chunkSection("khoiThongDongTienBanHang", RAG_DATA.khoiThongDongTienBanHang),
      ...chunkSection("khoiThongDongTienNhanQua", RAG_DATA.khoiThongDongTienNhanQua),
      ...chunkSection("thayMong", RAG_DATA.thayMong),
    ];
    const seeded = [];

    await deleteLegacyVectors(env);

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

async function deleteLegacyVectors(env) {
  if (typeof env.RAG_INDEX.deleteByIds !== "function") {
    return;
  }

  const ids = LEGACY_SOURCE_KEYS.flatMap((key) =>
    Array.from({ length: 20 }, (_, index) => `rag:${key}:${index}`),
  );

  await env.RAG_INDEX.deleteByIds(ids);
}
