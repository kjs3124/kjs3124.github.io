import { getAdminCodes, jsonResponse, readJsonBody } from "./_participants.js";

export async function POST(request) {
  const body = await readJsonBody(request);
  const name = String(body.name || "").trim();
  const adminCodes = getAdminCodes();

  return jsonResponse({
    ok: true,
    isAdmin: adminCodes.includes(name)
  });
}

export function GET() {
  return jsonResponse({ ok: false, message: "POST만 지원합니다." }, 405);
}
