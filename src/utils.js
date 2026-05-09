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

function calculateSentenceAccuracy(expected, recognized) {
  const e = normalizeText(expected);
  const r = normalizeText(recognized);

  if (!e || !r) return 0;
  if (e === r) return 100;

  const eWords = e.split(" ");
  const rWords = r.split(" ");
  let matched = 0;

  eWords.forEach((word, idx) => {
    if (rWords[idx] === word) matched += 1;
  });

  return Math.round((matched / eWords.length) * 100);
}

function formatResultTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}초 ${String(seconds).padStart(2, "0")}`;
}

function formatRunningTimer(totalCentiseconds) {
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(centiseconds).padStart(2, "0")}`;
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
  console.assert(formatRunningTimer(0) === "00:00:00", "timer 0 failed");
  console.assert(formatRunningTimer(1) === "00:00:01", "timer 1 failed");
  console.assert(formatRunningTimer(6150) === "01:01:50", "timer 6150 failed");
  console.assert(formatResultTime(65) === "01초 05", "result time failed");
  console.assert(calculateSentenceAccuracy("안녕 하세요", "안녕 하세요") === 100, "accuracy exact failed");
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
