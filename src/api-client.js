async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "서버 요청에 실패했습니다.");
  }

  return data;
}

function recordParticipationRequest({ name, practiceType }) {
  return postJson("/api/record", { name, practiceType });
}

function loadAdminParticipantsRequest({ code }) {
  return postJson("/api/admin", { code });
}

function checkAdminAccessRequest({ name }) {
  return postJson("/api/admin-access", { name });
}

window.VoicePracticeApi = {
  recordParticipationRequest,
  loadAdminParticipantsRequest,
  checkAdminAccessRequest
};
