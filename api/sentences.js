import {
  getEffectiveAdminCodes,
  hasBlobToken,
  jsonResponse,
  normalizeSentences,
  readJsonBody,
  readSentenceConfig,
  writeSentenceConfig
} from "./_participants.js";

export async function GET() {
  if (!hasBlobToken()) {
    return jsonResponse({ ok: true, sentences: [], updatedAt: "" });
  }

  const config = await readSentenceConfig();
  return jsonResponse({
    ok: true,
    sentences: config?.sentences || [],
    updatedAt: config?.updatedAt || ""
  });
}

export async function POST(request) {
  if (!hasBlobToken()) {
    return jsonResponse({ ok: false, message: "Blob 저장소 토큰이 서버에 설정되지 않았습니다." }, 500);
  }

  const body = await readJsonBody(request);
  const code = String(body.code || "").trim();
  const adminCodes = await getEffectiveAdminCodes();

  if (!adminCodes.length) {
    return jsonResponse({ ok: false, message: "관리자 코드가 설정되지 않았습니다." }, 500);
  }

  if (!adminCodes.includes(code)) {
    return jsonResponse({ ok: false, message: "관리자 코드가 올바르지 않습니다." }, 401);
  }

  if (body.action === "save") {
    try {
      const config = await writeSentenceConfig(body.sentences);
      return jsonResponse({ ok: true, ...config });
    } catch (error) {
      return jsonResponse({ ok: false, message: error.message || "연습 문장 저장에 실패했습니다." }, 400);
    }
  }

  const config = await readSentenceConfig();
  return jsonResponse({
    ok: true,
    sentences: normalizeSentences(config?.sentences),
    updatedAt: config?.updatedAt || ""
  });
}
