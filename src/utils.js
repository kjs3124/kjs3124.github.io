const { AVERAGE_SPEED_SECONDS } = window.VoicePracticeConstants;

function shuffleSentences(sentences) {
  const copied = [...sentences];

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w가-힣\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLevenshteinDistance(source, target) {
  const rows = source.length + 1;
  const cols = target.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[source.length][target.length];
}

function calculateSentenceAccuracy(expected, recognized) {
  const e = normalizeText(expected).replace(/\s/g, "");
  const r = normalizeText(recognized).replace(/\s/g, "");

  if (!e || !r) return 0;
  if (e === r) return 100;

  const distance = getLevenshteinDistance(e, r);
  const accuracy = (1 - distance / Math.max(e.length, r.length)) * 100;
  return Math.max(0, Math.round(accuracy));
}

function formatResultTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}초 ${String(seconds).padStart(2, "0")}`;
}

function formatRunningTimer(totalCentiseconds) {
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const milliseconds = (totalCentiseconds % 100) * 10;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function getSpeedResultText(speedSeconds) {
  const diff = speedSeconds - AVERAGE_SPEED_SECONDS;

  if (Math.abs(diff) <= 3) {
    return {
      title: "아주 적절하다!!",
      description: "참여자의 평균속도와 거의 비슷하게 끝났어요."
    };
  }

  if (diff < 0) {
    return {
      title: "조금 빠르다..!",
      description: "참여자의 평균속도보다 빨리 끝났어요."
    };
  }

  return {
    title: "조금 느리다..!",
    description: "참여자의 평균속도보다 느리게 끝났어요."
  };
}

function runSelfTests() {
  console.assert(formatRunningTimer(0) === "00:00.000", "timer 0 failed");
  console.assert(formatRunningTimer(1) === "00:00.010", "timer 1 failed");
  console.assert(formatRunningTimer(6150) === "01:01.500", "timer 6150 failed");
  console.assert(formatResultTime(65) === "01초 05", "result time failed");
  console.assert(calculateSentenceAccuracy("안녕 하세요", "안녕 하세요") === 100, "accuracy exact failed");
  console.assert(calculateSentenceAccuracy("우리 친구들 선생님 얼굴", "우리 친구 선생님 얼굴") >= 80, "accuracy fuzzy failed");
  console.assert(getSpeedResultText(62).title === "아주 적절하다!!", "speed equal range failed");
  console.assert(getSpeedResultText(50).title === "조금 빠르다..!", "speed fast failed");
  console.assert(getSpeedResultText(80).title === "조금 느리다..!", "speed slow failed");
}

runSelfTests();

window.VoicePracticeUtils = {
  shuffleSentences,
  calculateSentenceAccuracy,
  formatResultTime,
  formatRunningTimer,
  getSpeedResultText
};
