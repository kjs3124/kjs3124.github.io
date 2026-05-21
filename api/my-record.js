import { getParticipantAccuracyStats, hasBlobToken, jsonResponse, readJsonBody, readParticipant } from "./_participants.js";

export async function POST(request) {
  if (!hasBlobToken()) {
    return jsonResponse({ ok: false, message: "Blob 저장소 토큰이 서버에 설정되지 않았습니다." }, 500);
  }

  const body = await readJsonBody(request);
  const name = String(body.name || "").trim();

  if (!name) {
    return jsonResponse({ ok: false, message: "이름을 입력하세요." }, 400);
  }

  const participant = await readParticipant(name);

  if (!participant) {
    return jsonResponse({
      ok: true,
      participant: null
    });
  }

  const records = (Array.isArray(participant.records) ? participant.records : [])
    .map((record) => ({
      participatedAt: record?.participatedAt || "",
      participatedAtMs: Number(record?.participatedAtMs || 0),
      practiceType: record?.practiceType === "speed" ? "speed" : "pronunciation",
      accuracy: Number.isFinite(Number(record?.accuracy)) ? Math.round(Number(record.accuracy)) : null
    }))
    .sort((a, b) => b.participatedAtMs - a.participatedAtMs);

  return jsonResponse({
    ok: true,
    participant: {
      name: participant.name,
      totalCount: Number(participant.totalCount || 0),
      participationDates: Array.isArray(participant.participationDates)
        ? participant.participationDates
        : [],
      lastParticipatedAt: participant.lastParticipatedAt || "",
      lastParticipatedAtMs: Number(participant.lastParticipatedAtMs || 0),
      lastPracticeType: participant.lastPracticeType || "",
      lastAccuracy: Number.isFinite(Number(participant.lastAccuracy)) ? Math.round(Number(participant.lastAccuracy)) : null,
      accuracyStats: getParticipantAccuracyStats(participant),
      records
    }
  });
}

export function GET() {
  return jsonResponse({ ok: false, message: "POST만 지원합니다." }, 405);
}
