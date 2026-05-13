const GREETING_SPEED_TEXT = `우리 친구들~ 안녕! 한 주 동안 잘 지냈어요?
선생님 목소리 들리고 얼굴 잘 보이면 동그라미 손 해볼까요?
서린이 희민이 주원이 용현이 종훈이 만나서 너무 반가워!!
오늘 우리 친구들 선생님 처음 보죠?
우리 친구들과 오늘부터 함께 수업할 000 선생님이에요! 만나서 너무 반가워요~
오늘도 사랑이 넘치는 5월이 되자는 의미로 "손하트" 해보자!
오늘은 생각 읽기 책 <치카치카 치카 탐정- 까르르 마을의 아이들을 지켜라!>이야기를 보며
대상간의 공통점과 차이점을 찾는 비교와 대조에 대해 알아보고,
이 방법으로 새로운 놀이 기구를 생각해 발표를 해 볼 거예요.`;

window.VoicePracticeConstants = {
  PRONUNCIATION_CATEGORIES: [
    { id: "general", label: "일반" },
    { id: "greeting", label: "인사" },
    { id: "writing", label: "글쓰기 안내" },
    { id: "presentation", label: "발표 경청" }
  ],
  PRONUNCIATION_SENTENCES: [
    "경찰청 철창 철거 작업반은 철제 철망 점검 절차를 재정비하였다.",
    "지금 동영이 얼굴이 안 보여서 선생님이 새로고침 해줄테니 수업방 다시 들어와보자!",
    "방송국 발성 훈련 담당자는 발음 정확도 평가 기준을 강화하였다.",
    "르네상스 시대 미켈란젤로는 조각과 벽화 분야에서 뛰어난 업적을 남겼다.",
    "조선 후기 실학자들은 농업 생산력 향상 방안을 적극적으로 연구하였다.",
    "칠흑 같은 새벽 골목길 돌계단 아래로 빗방울 소리가 번져갔다.",
    "제2차 세계대전 종전 이후 냉전 체제가 빠르게 형성되기 시작하였다.",
    "우리 친구들 선생님 얼굴 잘 보이고, 목소리 잘 들리면 동그라미 손해볼까요?",
    "플라스틱 물병 뚜껑 분리 과정에서 미끄러짐 사고가 반복적으로 발생했다.",
    "실크로드 교역 과정에서는 비단과 향료, 금속 공예품이 거래되었다."
  ],
  SPEED_PRACTICE_TYPES: [
    {
      id: "greeting",
      label: "인사",
      targetMinSeconds: 42,
      targetMaxSeconds: 45,
      text: GREETING_SPEED_TEXT
    },
    {
      id: "writing",
      label: "글쓰기 안내",
      targetMinSeconds: 44,
      targetMaxSeconds: 47,
      text: `여러분, 오늘 글쓰기 활동을 시작하겠습니다.
먼저 주제를 읽고 내가 전하고 싶은 생각을 한 문장으로 정리해 보세요.
그다음 이유나 예시를 두 가지 이상 떠올린 뒤, 글의 순서를 정합니다.
처음에는 글의 주제를 소개하고, 가운데에는 자세한 설명을 넣습니다.
마지막에는 내 생각을 다시 정리하며 자연스럽게 마무리합니다.
문장을 쓸 때는 같은 표현을 반복하지 않도록 살펴보고,
맞춤법과 띄어쓰기도 천천히 확인해 봅시다.
다 쓴 친구는 소리 내어 읽으며 어색한 부분을 고쳐 주세요.`
    },
    {
      id: "presentation",
      label: "발표 경청",
      targetMinSeconds: 37,
      targetMaxSeconds: 40,
      text: `친구가 발표할 때는 말하는 사람을 바라보며 조용히 듣습니다.
발표 내용을 들으면서 중요한 낱말이나 새롭게 알게 된 점을 기억해 봅시다.
궁금한 점이 생기면 발표가 끝난 뒤 손을 들고 차례를 기다립니다.
질문할 때는 친구의 생각을 존중하는 말투로 이야기합니다.
발표를 들은 뒤에는 잘한 점을 먼저 말하고,
더 알고 싶은 내용을 짧게 덧붙여 봅시다.
서로의 발표를 귀 기울여 들으면 우리 모두의 생각이 더 넓어집니다.`
    }
  ],
  DEFAULT_SPEED_PRACTICE_TYPE_ID: "greeting",
  SPEED_TEXT: GREETING_SPEED_TEXT,
  SPEED_TARGET_MIN_SECONDS: 42,
  SPEED_TARGET_MAX_SECONDS: 45,
  PRONUNCIATION_TIME_LIMIT_SECONDS: 10,
  DEFAULT_PRONUNCIATION_QUESTION_COUNT: 10
};
