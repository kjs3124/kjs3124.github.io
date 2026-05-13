import {
  getEffectiveAdminCodes,
  hasBlobToken,
  jsonResponse,
  normalizeAdminCodes,
  readAdminConfig,
  readJsonBody,
  writeAdminConfig
} from "./_participants.js";

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
    const nextCodes = normalizeAdminCodes(body.adminCodes);

    if (!nextCodes.includes(code)) {
      return jsonResponse({ ok: false, message: "현재 로그인한 관리자 코드는 목록에 남겨야 합니다." }, 400);
    }

    try {
      const config = await writeAdminConfig(nextCodes);
      return jsonResponse({ ok: true, ...config });
    } catch (error) {
      return jsonResponse({ ok: false, message: error.message || "관리자 코드 저장에 실패했습니다." }, 400);
    }
  }

  const config = await readAdminConfig();
  return jsonResponse({
    ok: true,
    adminCodes,
    updatedAt: config?.updatedAt || ""
  });
}

export function GET() {
  return jsonResponse({ ok: false, message: "POST만 지원합니다." }, 405);
}
