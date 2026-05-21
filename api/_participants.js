import { get, list, put } from "@vercel/blob";

const PARTICIPANTS_PREFIX = "participants/";
const ADMIN_CONFIG_PATH = "config/admin.json";
const SENTENCE_CONFIG_PATH = "config/pronunciation-sentences.json";
const KOREA_TIME_ZONE = "Asia/Seoul";
const SENTENCE_CATEGORY_ALIASES = {
  general: "general",
  "일반": "general",
  greeting: "greeting",
  "인사": "greeting",
  writing: "writing",
  "글쓰기": "writing",
  "글쓰기 안내": "writing",
  presentation: "presentation",
  "발표": "presentation",
  "발표 경청": "presentation"
};

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

export function normalizeAdminCodes(codes) {
  return [...new Set((Array.isArray(codes) ? codes : [])
    .map((code) => String(code || "").trim())
    .filter(Boolean))];
}

export async function readAdminConfig() {
  try {
    const blob = await get(ADMIN_CONFIG_PATH, { access: "private" });
    if (!blob || blob.statusCode !== 200 || !blob.stream) return null;

    const text = await new Response(blob.stream).text();
    const data = JSON.parse(text);
    return {
      adminCodes: normalizeAdminCodes(data?.adminCodes),
      updatedAt: data?.updatedAt || ""
    };
  } catch {
    return null;
  }
}

export async function getEffectiveAdminCodes() {
  const config = await readAdminConfig();
  if (config?.adminCodes?.length) return config.adminCodes;
  return getAdminCodes();
}

export async function writeAdminConfig(adminCodes) {
  const normalizedCodes = normalizeAdminCodes(adminCodes);

  if (!normalizedCodes.length) {
    throw new Error("관리자 코드는 최소 1개 이상 필요합니다.");
  }

  const { display, sortValue } = getKoreaTimestamp();
  await put(ADMIN_CONFIG_PATH, JSON.stringify({
    adminCodes: normalizedCodes,
    updatedAt: display,
    updatedAtMs: sortValue
  }, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true
  });

  return {
    adminCodes: normalizedCodes,
    updatedAt: display
  };
}

export function normalizeSentences(sentences) {
  const seen = new Set();
  const normalized = [];

  (Array.isArray(sentences) ? sentences : []).forEach((sentence) => {
    const rawText = typeof sentence === "object" && sentence !== null
      ? sentence.text
      : sentence;
    const text = String(rawText || "").trim();
    const rawCategory = typeof sentence === "object" && sentence !== null
      ? sentence.category
      : "general";
    const category = SENTENCE_CATEGORY_ALIASES[String(rawCategory || "").trim()] || "general";
    const key = `${category}:${text}`;

    if (!text || seen.has(key)) return;

    seen.add(key);
    normalized.push({ category, text });
  });

  return normalized;
}

export async function readSentenceConfig() {
  try {
    const blob = await get(SENTENCE_CONFIG_PATH, { access: "private" });
    if (!blob || blob.statusCode !== 200 || !blob.stream) return null;

    const text = await new Response(blob.stream).text();
    const data = JSON.parse(text);
    return {
      sentences: normalizeSentences(data?.sentences),
      updatedAt: data?.updatedAt || ""
    };
  } catch {
    return null;
  }
}

export async function writeSentenceConfig(sentences) {
  const normalizedSentences = normalizeSentences(sentences);

  if (!normalizedSentences.length) {
    throw new Error("연습 문장은 최소 1개 이상 필요합니다.");
  }

  const { display, sortValue } = getKoreaTimestamp();
  await put(SENTENCE_CONFIG_PATH, JSON.stringify({
    sentences: normalizedSentences,
    updatedAt: display,
    updatedAtMs: sortValue
  }, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true
  });

  return {
    sentences: normalizedSentences,
    updatedAt: display
  };
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

export function getParticipantAccuracyStats(participant) {
  const recordAccuracies = (Array.isArray(participant?.records) ? participant.records : [])
    .filter((record) => record?.accuracy !== null && record?.accuracy !== undefined && record?.accuracy !== "")
    .map((record) => Number(record.accuracy))
    .filter((accuracy) => Number.isFinite(accuracy));

  const accuracies = recordAccuracies.length
    ? recordAccuracies
    : Number.isFinite(Number(participant?.lastAccuracy))
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

export function normalizeName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "사용자";
}
