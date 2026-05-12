import { get, list, put } from "@vercel/blob";

const PARTICIPANTS_PREFIX = "participants/";
const KOREA_TIME_ZONE = "Asia/Seoul";

export function jsonResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function getAdminCodes() {
  return (process.env.ADMIN_CODES || "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getKoreaTimestamp(date = new Date()) {
  return {
    display: new Intl.DateTimeFormat("ko-KR", {
      timeZone: KOREA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date),
    sortValue: date.getTime()
  };
}

export function getParticipantPath(name) {
  const fileName = normalizeName(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim();

  return `${PARTICIPANTS_PREFIX}${fileName || "사용자"}.json`;
}

export async function readParticipant(name) {
  try {
    const blob = await get(getParticipantPath(name), { access: "private" });
    if (!blob || blob.statusCode !== 200 || !blob.stream) return null;

    const text = await new Response(blob.stream).text();
    const data = JSON.parse(text);
    return normalizeParticipant(data);
  } catch {
    return null;
  }
}

export async function writeParticipant(participant) {
  const normalized = normalizeParticipant(participant);
  await put(getParticipantPath(normalized.name), JSON.stringify(normalized, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true
  });
}

export async function listParticipants() {
  const result = await list({
    prefix: PARTICIPANTS_PREFIX,
    limit: 1000
  });

  const blobs = result.blobs || [];
  const participants = [];

  for (const item of blobs) {
    try {
      const blob = await get(item.pathname, { access: "private" });
      if (!blob || blob.statusCode !== 200 || !blob.stream) continue;

      const text = await new Response(blob.stream).text();
      participants.push(normalizeParticipant(JSON.parse(text)));
    } catch {
      continue;
    }
  }

  return participants;
}

export function normalizeParticipant(data) {
  const name = normalizeName(data?.name);
  const participationDates = Array.isArray(data?.participationDates)
    ? data.participationDates.filter(Boolean)
    : [];

  return {
    name,
    totalCount: Number(data?.totalCount || participationDates.length || 0),
    participationDates,
    records: Array.isArray(data?.records) ? data.records : [],
    lastPracticeType: data?.lastPracticeType || "",
    lastParticipatedAt: data?.lastParticipatedAt || participationDates[participationDates.length - 1] || "",
    lastParticipatedAtMs: Number(data?.lastParticipatedAtMs || 0),
    lastAccuracy: Number.isFinite(Number(data?.lastAccuracy)) ? Math.round(Number(data.lastAccuracy)) : null
  };
}

export function normalizeName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "사용자";
}
