import {
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
  const participatedAt = new Date().toISOString();
  const previous = (await readParticipant(name)) || {
    name,
    totalCount: 0,
    participationDates: []
  };

  const participant = {
    name: previous.name || name,
    totalCount: Number(previous.totalCount || 0) + 1,
    participationDates: [
      ...(Array.isArray(previous.participationDates) ? previous.participationDates : []),
      participatedAt
    ],
    lastPracticeType: practiceType,
    lastParticipatedAt: participatedAt
  };

  try {
    await writeParticipant(participant);
  } catch {
    return jsonResponse({ ok: false, message: "참여 기록 저장에 실패했습니다." }, 500);
  }

  return jsonResponse({
    ok: true,
    participant: {
      name: participant.name,
      totalCount: participant.totalCount,
      lastParticipatedAt: participatedAt
    }
  });
}

export function GET() {
  return jsonResponse({ ok: false, message: "POST만 지원합니다." }, 405);
}
