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

async function getJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "서버 요청에 실패했습니다.");
  }

  return data;
}

function recordParticipationRequest({ name, practiceType, accuracy }) {
  return postJson("/api/record", { name, practiceType, accuracy });
}

function loadMyRecordRequest({ name }) {
  return postJson("/api/my-record", { name });
}

function loadAdminParticipantsRequest({ code }) {
  return postJson("/api/admin", { code });
}

function checkAdminAccessRequest({ name }) {
  return postJson("/api/admin-access", { name });
}

function loadAdminConfigRequest({ code }) {
  return postJson("/api/admin-config", { code });
}

function saveAdminConfigRequest({ code, adminCodes }) {
  return postJson("/api/admin-config", {
    code,
    adminCodes,
    action: "save"
  });
}

function loadPracticeSentencesRequest() {
  return getJson("/api/sentences");
}

function loadAdminSentencesRequest({ code }) {
  return postJson("/api/sentences", { code });
}

function saveAdminSentencesRequest({ code, sentences }) {
  return postJson("/api/sentences", {
    code,
    sentences,
    action: "save"
  });
}

window.VoicePracticeApi = {
  recordParticipationRequest,
  loadMyRecordRequest,
  loadAdminParticipantsRequest,
  checkAdminAccessRequest,
  loadAdminConfigRequest,
  saveAdminConfigRequest,
  loadPracticeSentencesRequest,
  loadAdminSentencesRequest,
  saveAdminSentencesRequest
};
