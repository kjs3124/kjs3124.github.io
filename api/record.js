import {
  getKoreaTimestamp,
  hasBlobToken,
  jsonResponse,
  normalizeName,
  readParticipant,
  readJsonBody,
  writeParticipant
} from "./_participants.js";

export async function POST(request) {
  if (!hasBlobToken()) {
    return jsonResponse({ ok: false, message: "Blob 저장소 토큰이 서버에 설정되지 않았습니다." }, 500);
  }

  const body = await readJsonBody(request);
  const name = normalizeName(body.name);
  const practiceType = body.practiceType === "speed" ? "speed" : "pronunciation";
  const accuracy = Number.isFinite(Number(body.accuracy)) ? Math.round(Number(body.accuracy)) : null;
  const participatedAt = getKoreaTimestamp();
  const previous = (await readParticipant(name)) || {
    name,
    totalCount: 0,
    participationDates: [],
    records: []
  };

  const participant = {
    name: previous.name || name,
    totalCount: Number(previous.totalCount || 0) + 1,
    participationDates: [
      ...(Array.isArray(previous.participationDates) ? previous.participationDates : []),
      participatedAt.display
    ],
    records: [
      ...(Array.isArray(previous.records) ? previous.records : []),
      {
        participatedAt: participatedAt.display,
        participatedAtMs: participatedAt.sortValue,
        practiceType,
        accuracy
      }
    ],
    lastPracticeType: practiceType,
    lastParticipatedAt: participatedAt.display,
    lastParticipatedAtMs: participatedAt.sortValue,
    lastAccuracy: accuracy
  };

  try {
    await writeParticipant(participant);
  } catch (error) {
    console.error("Failed to write participant record", {
      name,
      practiceType,
      errorName: error?.name,
      errorMessage: error?.message
    });
    return jsonResponse({ ok: false, message: "참여 기록 저장에 실패했습니다." }, 500);
  }

  return jsonResponse({
    ok: true,
    participant: {
      name: participant.name,
      totalCount: participant.totalCount,
      lastParticipatedAt: participatedAt.display
    }
  });
}

export function GET() {
  return jsonResponse({ ok: false, message: "POST만 지원합니다." }, 405);
}
