import { getEffectiveAdminCodes, hasBlobToken, jsonResponse, listParticipants, readJsonBody } from "./_participants.js";

function getAccuracyStats(participant) {
  const recordAccuracies = (Array.isArray(participant.records) ? participant.records : [])
    .filter((record) => record?.accuracy !== null && record?.accuracy !== undefined && record?.accuracy !== "")
    .map((record) => Number(record.accuracy))
    .filter((accuracy) => Number.isFinite(accuracy));

  const accuracies = recordAccuracies.length
    ? recordAccuracies
    : Number.isFinite(Number(participant.lastAccuracy))
      ? [Number(participant.lastAccuracy)]
      : [];

  if (!accuracies.length) {
    return {
      recent: null,
      highest: null,
      lowest: null,
      average: null
    };
  }

  const sum = accuracies.reduce((acc, accuracy) => acc + accuracy, 0);

  return {
    recent: Math.round(accuracies[accuracies.length - 1]),
    highest: Math.round(Math.max(...accuracies)),
    lowest: Math.round(Math.min(...accuracies)),
    average: Math.round(sum / accuracies.length)
  };
}

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
    .map((participant) => {
      const accuracyStats = getAccuracyStats(participant);

      return {
        name: participant.name,
        totalCount: Number(participant.totalCount || 0),
        participationDates: Array.isArray(participant.participationDates)
          ? participant.participationDates
          : [],
        lastParticipatedAt: participant.lastParticipatedAt || "",
        lastParticipatedAtMs: Number(participant.lastParticipatedAtMs || 0),
        lastAccuracy: accuracyStats.recent,
        accuracyStats
      };
    })
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
