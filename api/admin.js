import { getEffectiveAdminCodes, hasBlobToken, jsonResponse, listParticipants, readJsonBody } from "./_participants.js";

export async function POST(request) {
  const body = await readJsonBody(request);
  const code = String(body.code || "").trim();
  const adminCodes = await getEffectiveAdminCodes();

  if (!hasBlobToken()) {
    return jsonResponse({ ok: false, message: "Blob 저장소 토큰이 서버에 설정되지 않았습니다." }, 500);
  }

  if (!adminCodes.length) {
    return jsonResponse({ ok: false, message: "관리자 코드가 서버에 설정되지 않았습니다." }, 500);
  }

  if (!adminCodes.includes(code)) {
    return jsonResponse({ ok: false, message: "관리자 코드가 올바르지 않습니다." }, 401);
  }

  const participants = (await listParticipants())
    .map((participant) => ({
      name: participant.name,
      totalCount: Number(participant.totalCount || 0),
      participationDates: Array.isArray(participant.participationDates)
        ? participant.participationDates
        : [],
      lastParticipatedAt: participant.lastParticipatedAt || "",
      lastParticipatedAtMs: Number(participant.lastParticipatedAtMs || 0),
      lastAccuracy: Number.isFinite(Number(participant.lastAccuracy))
        ? Math.round(Number(participant.lastAccuracy))
        : null
    }))
    .sort((a, b) => {
      return b.lastParticipatedAtMs - a.lastParticipatedAtMs;
    });

  return jsonResponse({
    ok: true,
    participants
  });
}

export function GET() {
  return jsonResponse({ ok: false, message: "POST만 지원합니다." }, 405);
}
