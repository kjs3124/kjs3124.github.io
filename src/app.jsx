const { useEffect, useMemo, useRef, useState } = React;
const {
  PRONUNCIATION_CATEGORIES,
  PRONUNCIATION_SENTENCES,
  SPEED_PRACTICE_TYPES,
  DEFAULT_SPEED_PRACTICE_TYPE_ID,
  PRONUNCIATION_TIME_LIMIT_SECONDS,
  DEFAULT_PRONUNCIATION_QUESTION_COUNT
} = window.VoicePracticeConstants;
const {
  shuffleSentences,
  calculateSentenceAccuracy,
  formatResultTime,
  formatRunningTimer,
  getSpeedResultText
} = window.VoicePracticeUtils;
const {
  recordParticipationRequest,
  loadAdminParticipantsRequest,
  checkAdminAccessRequest,
  loadAdminConfigRequest,
  saveAdminConfigRequest,
  loadPracticeSentencesRequest,
  loadAdminSentencesRequest,
  saveAdminSentencesRequest
} = window.VoicePracticeApi;

const CATEGORY_LABEL_BY_ID = PRONUNCIATION_CATEGORIES.reduce((acc, category) => {
  acc[category.id] = category.label;
  return acc;
}, {});

const CATEGORY_ID_BY_LABEL = PRONUNCIATION_CATEGORIES.reduce((acc, category) => {
  acc[category.label] = category.id;
  return acc;
}, {});

function normalizePronunciationItems(sentences) {
  const seen = new Set();
  const items = [];

  (Array.isArray(sentences) ? sentences : []).forEach((sentence) => {
    const text = typeof sentence === "object" && sentence !== null
      ? String(sentence.text || "").trim()
      : String(sentence || "").trim();
    const rawCategory = typeof sentence === "object" && sentence !== null
      ? String(sentence.category || "").trim()
      : "general";
    const category = CATEGORY_LABEL_BY_ID[rawCategory]
      ? rawCategory
      : CATEGORY_ID_BY_LABEL[rawCategory] || "general";
    const key = `${category}:${text}`;

    if (!text || seen.has(key)) return;

    seen.add(key);
    items.push({ category, text });
  });

  return items;
}

function parseSentenceParagraph(paragraph) {
  const trimmed = String(paragraph || "").trim();
  return {
    category: "general",
    text: trimmed
  };
}

function formatSentencesForCategory(items, category) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item.category === category)
    .map((item) => item.text)
    .join("\n\n");
}

function VoicePracticeSite() {
        const defaultSentenceItems = useMemo(() => normalizePronunciationItems(PRONUNCIATION_SENTENCES), []);
        const [screen, setScreen] = useState("start");
        const [name, setName] = useState("");

        const [activePronunciationSentences, setActivePronunciationSentences] = useState(() =>
          shuffleSentences(PRONUNCIATION_SENTENCES)
        );
        const [sentencePool, setSentencePool] = useState(() => normalizePronunciationItems(PRONUNCIATION_SENTENCES));
        const [pronunciationIndex, setPronunciationIndex] = useState(0);
        const [pronunciationQuestionCount, setPronunciationQuestionCount] = useState(DEFAULT_PRONUNCIATION_QUESTION_COUNT);
        const [pronunciationTimeLimit, setPronunciationTimeLimit] = useState(PRONUNCIATION_TIME_LIMIT_SECONDS);
        const [pronunciationTimeLeft, setPronunciationTimeLeft] = useState(PRONUNCIATION_TIME_LIMIT_SECONDS);
        const [isPronunciationRecording, setIsPronunciationRecording] = useState(false);
        const [showPronunciationDetail, setShowPronunciationDetail] = useState(false);
        const [pronunciationResults, setPronunciationResults] = useState(
          PRONUNCIATION_SENTENCES.map((sentence, index) => ({
            index,
            expected: sentence,
            recognized: "",
            accuracy: 0
          }))
        );

        const [speedSeconds, setSpeedSeconds] = useState(0);
        const [speedCentiseconds, setSpeedCentiseconds] = useState(0);
        const [selectedSpeedTypeId, setSelectedSpeedTypeId] = useState(DEFAULT_SPEED_PRACTICE_TYPE_ID);
        const [isSpeedRecording, setIsSpeedRecording] = useState(false);
        const [speedRecognizedText, setSpeedRecognizedText] = useState("");
        const [showSpeedDetail, setShowSpeedDetail] = useState(false);
        const [recognitionMessage, setRecognitionMessage] = useState("");
        const [recordMessage, setRecordMessage] = useState("");
        const [startMessage, setStartMessage] = useState("");
        const [adminMessage, setAdminMessage] = useState("");
        const [adminParticipants, setAdminParticipants] = useState([]);
        const [isAdminLoading, setIsAdminLoading] = useState(false);
        const [adminConfigMessage, setAdminConfigMessage] = useState("");
        const [adminCodesText, setAdminCodesText] = useState("");
        const [isAdminConfigLoading, setIsAdminConfigLoading] = useState(false);
        const [adminSentencesMessage, setAdminSentencesMessage] = useState("");
        const [adminSentencesText, setAdminSentencesText] = useState("");
        const [adminSentenceCategory, setAdminSentenceCategory] = useState("general");
        const [isAdminSentencesLoading, setIsAdminSentencesLoading] = useState(false);
        const [isAdminUser, setIsAdminUser] = useState(false);
        const [micLevel, setMicLevel] = useState(0);
        const [micMessage, setMicMessage] = useState("");

        const recognitionRef = useRef(null);
        const pronunciationTimerRef = useRef(null);
        const speedTimerRef = useRef(null);
        const micStreamRef = useRef(null);
        const micAudioContextRef = useRef(null);
        const micAnimationFrameRef = useRef(null);
        const finalTranscriptRef = useRef("");

        const displayUserName = name.trim() ? `${name.trim()}님` : "사용자";
        const menuTitle = `${displayUserName}의 연습`;

        const overallPronunciationAccuracy = useMemo(() => {
          if (!pronunciationResults.length) return 0;
          const sum = pronunciationResults.reduce((acc, cur) => acc + (cur.accuracy || 0), 0);
          return Math.round(sum / pronunciationResults.length);
        }, [pronunciationResults]);

        const selectedSpeedType = useMemo(() => (
          SPEED_PRACTICE_TYPES.find((type) => type.id === selectedSpeedTypeId) || SPEED_PRACTICE_TYPES[0]
        ), [selectedSpeedTypeId]);
        const speedResult = useMemo(() => getSpeedResultText(speedSeconds, selectedSpeedType), [speedSeconds, selectedSpeedType]);
        const generalSentencePool = useMemo(() => (
          sentencePool.filter((item) => item.category === "general")
        ), [sentencePool]);
        const sentenceCountMax = Math.max(1, generalSentencePool.length);

        const formatAccuracy = (accuracy) => (
          typeof accuracy === "number" ? `${accuracy}%` : "-"
        );

        const recordParticipation = async (practiceType) => {
          try {
            await recordParticipationRequest({
              name: name.trim(),
              practiceType,
              accuracy: practiceType === "pronunciation" ? overallPronunciationAccuracy : null
            });
            setRecordMessage("참여 기록이 저장되었습니다.");
          } catch (error) {
            setRecordMessage(error.message || "서버에 참여 기록을 저장하지 못했습니다.");
          }
        };

        const loadAdminParticipants = async () => {
          setIsAdminLoading(true);
          setAdminMessage("");

          try {
            const data = await loadAdminParticipantsRequest({
              code: name.trim()
            });
            setAdminParticipants(data.participants || []);
            setAdminMessage(`${(data.participants || []).length}명의 참여자를 불러왔습니다.`);
          } catch (error) {
            setAdminParticipants([]);
            setAdminMessage(error.message || "서버에 연결하지 못했습니다.");
          } finally {
            setIsAdminLoading(false);
          }
        };

        const loadAdminConfig = async () => {
          setIsAdminConfigLoading(true);
          setAdminConfigMessage("");

          try {
            const data = await loadAdminConfigRequest({
              code: name.trim()
            });
            setAdminCodesText((data.adminCodes || []).join("\n"));
            setAdminConfigMessage(
              data.updatedAt ? `관리자 코드를 불러왔습니다. 마지막 수정: ${data.updatedAt}` : "관리자 코드를 불러왔습니다."
            );
          } catch (error) {
            setAdminCodesText("");
            setAdminConfigMessage(error.message || "관리자 코드 설정을 불러오지 못했습니다.");
          } finally {
            setIsAdminConfigLoading(false);
          }
        };

        const loadPracticeSentences = async () => {
          try {
            const data = await loadPracticeSentencesRequest();
            const sentences = normalizePronunciationItems(data.sentences);
            const nextSentences = sentences.length ? sentences : defaultSentenceItems;

            setSentencePool(nextSentences);
            setPronunciationQuestionCount((prev) => Math.min(prev, nextSentences.length));
            return nextSentences;
          } catch {
            setSentencePool(defaultSentenceItems);
            setPronunciationQuestionCount((prev) => Math.min(prev, defaultSentenceItems.length));
            return defaultSentenceItems;
          }
        };

        const loadAdminSentences = async () => {
          setIsAdminSentencesLoading(true);
          setAdminSentencesMessage("");

          try {
            const data = await loadAdminSentencesRequest({
              code: name.trim()
            });
            const loadedSentences = normalizePronunciationItems(data.sentences);
            const sentences = loadedSentences.length
              ? loadedSentences
              : sentencePool;

            setSentencePool(sentences);
            setAdminSentencesText(formatSentencesForCategory(sentences, adminSentenceCategory));
            setAdminSentencesMessage(
              data.updatedAt ? `연습 문장을 불러왔습니다. 마지막 수정: ${data.updatedAt}` : "저장된 문장이 없어 현재 기본 문장을 표시합니다."
            );
          } catch (error) {
            setAdminSentencesText("");
            setAdminSentencesMessage(error.message || "연습 문장을 불러오지 못했습니다.");
          } finally {
            setIsAdminSentencesLoading(false);
          }
        };

        const saveAdminSentences = async () => {
          const categorySentences = adminSentencesText
            .split(/\n\s*\n+/)
            .map(parseSentenceParagraph)
            .filter((sentence) => sentence.text)
            .map((sentence) => ({
              category: adminSentenceCategory,
              text: sentence.text
            }));
          const sentences = [
            ...sentencePool.filter((sentence) => sentence.category !== adminSentenceCategory),
            ...categorySentences
          ];

          setIsAdminSentencesLoading(true);
          setAdminSentencesMessage("");

          try {
            const data = await saveAdminSentencesRequest({
              code: name.trim(),
              sentences
            });
            const savedSentences = normalizePronunciationItems(data.sentences);
            const nextSentences = savedSentences.length ? savedSentences : defaultSentenceItems;
            setAdminSentencesText(formatSentencesForCategory(nextSentences, adminSentenceCategory));
            setSentencePool(nextSentences);
            setPronunciationQuestionCount((prev) => Math.min(prev, nextSentences.length));
            setAdminSentencesMessage(
              data.updatedAt ? `연습 문장이 저장되었습니다. 마지막 수정: ${data.updatedAt}` : "연습 문장이 저장되었습니다."
            );
          } catch (error) {
            setAdminSentencesMessage(error.message || "연습 문장 저장에 실패했습니다.");
          } finally {
            setIsAdminSentencesLoading(false);
          }
        };

        const saveAdminConfig = async () => {
          const adminCodes = adminCodesText
            .split(/[\n,]+/)
            .map((code) => code.trim())
            .filter(Boolean);

          setIsAdminConfigLoading(true);
          setAdminConfigMessage("");

          try {
            const data = await saveAdminConfigRequest({
              code: name.trim(),
              adminCodes
            });
            setAdminCodesText((data.adminCodes || []).join("\n"));
            setIsAdminUser((data.adminCodes || []).includes(name.trim()));
            setAdminConfigMessage(
              data.updatedAt ? `관리자 코드가 저장되었습니다. 마지막 수정: ${data.updatedAt}` : "관리자 코드가 저장되었습니다."
            );
          } catch (error) {
            setAdminConfigMessage(error.message || "관리자 코드 저장에 실패했습니다.");
          } finally {
            setIsAdminConfigLoading(false);
          }
        };

        const openAdminScreen = () => {
          setScreen("admin");
          loadAdminConfig();
          loadAdminSentences();
        };

        const enterPracticeMenu = async () => {
          const trimmedName = name.trim();

          if (!trimmedName) {
            setStartMessage("이름을 입력하세요.");
            return;
          }

          setStartMessage("");
          setIsAdminUser(false);

          try {
            const data = await checkAdminAccessRequest({
              name: trimmedName
            });
            setIsAdminUser(Boolean(data.isAdmin));
          } catch {
            setIsAdminUser(false);
          } finally {
            setScreen("menu");
          }
        };

        const stopRecognition = () => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // 이미 중지된 경우 무시합니다.
            }
            recognitionRef.current = null;
          }
        };

        const stopMicLevelMonitor = () => {
          if (micAnimationFrameRef.current) {
            cancelAnimationFrame(micAnimationFrameRef.current);
            micAnimationFrameRef.current = null;
          }

          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
          }

          if (micAudioContextRef.current) {
            micAudioContextRef.current.close().catch(() => {});
            micAudioContextRef.current = null;
          }

          setMicLevel(0);
        };

        const startMicLevelMonitor = async () => {
          if (!navigator.mediaDevices?.getUserMedia) {
            setMicMessage("이 브라우저에서는 마이크 입력 표시를 지원하지 않습니다.");
            return;
          }

          stopMicLevelMonitor();

          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            const data = new Uint8Array(analyser.fftSize);
            source.connect(analyser);
            micStreamRef.current = stream;
            micAudioContextRef.current = audioContext;
            setMicMessage("");

            const updateLevel = () => {
              analyser.getByteTimeDomainData(data);

              let sum = 0;
              for (let i = 0; i < data.length; i += 1) {
                const value = (data[i] - 128) / 128;
                sum += value * value;
              }

              const rms = Math.sqrt(sum / data.length);
              const level = Math.min(100, Math.round(rms * 260));
              setMicLevel(level);
              micAnimationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
          } catch {
            setMicLevel(0);
            setMicMessage("마이크 입력을 확인할 수 없습니다. 마이크 권한을 허용해 주세요.");
          }
        };

        const getRecognitionErrorMessage = (error) => {
          const messages = {
            "not-allowed": "마이크 권한이 차단되었습니다. 주소창의 마이크 권한을 허용해 주세요.",
            "service-not-allowed": "브라우저에서 음성 인식 서비스 사용이 차단되었습니다.",
            "no-speech": "음성이 감지되지 않았습니다. 마이크 입력 상태를 확인해 주세요.",
            "audio-capture": "마이크를 찾을 수 없습니다. 마이크 연결 상태를 확인해 주세요.",
            network: "음성 인식 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.",
            aborted: "음성 인식이 중단되었습니다."
          };

          return messages[error] || `음성 인식 오류가 발생했습니다. (${error || "unknown"})`;
        };

        const startRecognition = ({ mode, sentenceIndex = pronunciationIndex }) => {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

          if (!SpeechRecognition) {
            const message = "이 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요.";
            setRecognitionMessage(message);
            if (mode === "speed") setSpeedRecognizedText(message);
            return false;
          }

          stopRecognition();
          finalTranscriptRef.current = "";
          setRecognitionMessage("");

          const recognition = new SpeechRecognition();
          recognition.lang = "ko-KR";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
              const transcript = event.results[i][0].transcript.trim();
              if (event.results[i].isFinal) {
                finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
              } else {
                interimTranscript = `${interimTranscript} ${transcript}`.trim();
              }
            }

            const finalText = `${finalTranscriptRef.current} ${interimTranscript}`.trim();

            if (mode === "pronunciation") {
              setPronunciationResults((prev) =>
                prev.map((item, idx) =>
                  idx === sentenceIndex
                    ? {
                        ...item,
                        recognized: finalText,
                        accuracy: calculateSentenceAccuracy(item.expected, finalText)
                      }
                    : item
                )
              );
            }

            if (mode === "speed") {
              setSpeedRecognizedText(finalText);
            }
          };

          recognition.onerror = (event) => {
            const message = getRecognitionErrorMessage(event.error);
            setRecognitionMessage(message);
            if (mode === "speed") setSpeedRecognizedText(message);
          };
          recognitionRef.current = recognition;

          try {
            recognition.start();
            return true;
          } catch (error) {
            setRecognitionMessage("음성 인식을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
            recognitionRef.current = null;
            return false;
          }
        };

        const moveToNextPronunciationSentence = () => {
          stopRecognition();

          if (pronunciationIndex < activePronunciationSentences.length - 1) {
            const nextIndex = pronunciationIndex + 1;
            setPronunciationIndex(nextIndex);
            setPronunciationTimeLeft(pronunciationTimeLimit);
          } else {
            setIsPronunciationRecording(false);
            stopMicLevelMonitor();
            clearInterval(pronunciationTimerRef.current);
            recordParticipation("pronunciation");
            setScreen("pronunciation-result");
          }
        };

        const beginPronunciationRecording = async () => {
          setRecordMessage("");
          const latestSentences = await loadPracticeSentences();
          const generalSentences = latestSentences.filter((item) => item.category === "general");
          const selectedCount = Math.min(pronunciationQuestionCount, generalSentences.length);
          const shuffledSentences = shuffleSentences(generalSentences)
            .slice(0, selectedCount)
            .map((item) => item.text);
          setActivePronunciationSentences(shuffledSentences);
          setPronunciationResults(
            shuffledSentences.map((sentence, index) => ({
              index,
              expected: sentence,
              recognized: "",
              accuracy: 0
            }))
          );
          setPronunciationIndex(0);
          setPronunciationTimeLeft(pronunciationTimeLimit);
          setShowPronunciationDetail(false);
          setRecognitionMessage("");
          setMicMessage("");
          setScreen("pronunciation-recording");
          startMicLevelMonitor();
          const started = startRecognition({ mode: "pronunciation", sentenceIndex: 0 });
          setIsPronunciationRecording(started);
        };

        const goToPracticeMenu = () => {
          stopRecognition();
          stopMicLevelMonitor();
          clearInterval(pronunciationTimerRef.current);
          clearInterval(speedTimerRef.current);
          setIsPronunciationRecording(false);
          setIsSpeedRecording(false);
          setScreen("menu");
        };

        const retryPronunciationPractice = () => {
          stopRecognition();
          clearInterval(pronunciationTimerRef.current);
          beginPronunciationRecording();
        };

        const retrySpeedPractice = () => {
          stopRecognition();
          stopMicLevelMonitor();
          clearInterval(speedTimerRef.current);
          setSpeedSeconds(0);
          setSpeedCentiseconds(0);
          setSpeedRecognizedText("");
          setShowSpeedDetail(false);
          setIsSpeedRecording(false);
          setScreen("speed-practice");
        };

        const beginSpeedRecording = () => {
          setSpeedSeconds(0);
          setSpeedCentiseconds(0);
          setSpeedRecognizedText("");
          setShowSpeedDetail(false);
          setRecordMessage("");
          setRecognitionMessage("");
          setMicMessage("");

          setIsSpeedRecording(true);
          startMicLevelMonitor();

          const started = startRecognition({ mode: "speed" });
          if (!started) {
            stopMicLevelMonitor();
            setIsSpeedRecording(false);
          }
        };

        const endSpeedRecording = () => {
          stopRecognition();
          stopMicLevelMonitor();
          clearInterval(speedTimerRef.current);
          setIsSpeedRecording(false);
          recordParticipation("speed");

          setTimeout(() => {
            setScreen("speed-result");
          }, 1000);
        };

        useEffect(() => {
          loadPracticeSentences();
        }, []);

        useEffect(() => {
          if (screen !== "pronunciation-recording" || !isPronunciationRecording) return undefined;

          if (pronunciationIndex > 0) {
            const started = startRecognition({ mode: "pronunciation", sentenceIndex: pronunciationIndex });
            if (!started) {
              setIsPronunciationRecording(false);
              return undefined;
            }
          }

          pronunciationTimerRef.current = setInterval(() => {
            setPronunciationTimeLeft((prev) => {
              if (prev <= 1) {
                setTimeout(() => {
                  moveToNextPronunciationSentence();
                }, 0);
                return pronunciationTimeLimit;
              }
              return prev - 1;
            });
          }, 1000);

          return () => {
            clearInterval(pronunciationTimerRef.current);
            stopRecognition();
          };
        }, [screen, isPronunciationRecording, pronunciationIndex, pronunciationTimeLimit]);

        useEffect(() => {
          if (!isSpeedRecording) return undefined;

          speedTimerRef.current = setInterval(() => {
            setSpeedCentiseconds((prev) => {
              const next = prev + 1;
              setSpeedSeconds(Math.floor(next / 100));
              return next;
            });
          }, 10);

          return () => {
            clearInterval(speedTimerRef.current);
          };
        }, [isSpeedRecording]);

        useEffect(() => {
          return () => {
            stopMicLevelMonitor();
          };
        }, []);

        const HomeButton = () => (
          <button
            onClick={goToPracticeMenu}
            className="top-button"
          >
            ↩ 처음으로
          </button>
        );

        const MicLevelMeter = () => (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-black text-slate-600">
              <span>마이크 입력</span>
              <span>{micLevel}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${
                  micLevel > 12 ? "bg-emerald-500" : "bg-slate-400"
                }`}
                style={{ width: `${micLevel}%` }}
              />
            </div>
            <p className={`mt-3 text-sm font-bold ${micMessage ? "text-red-500" : "text-slate-500"}`}>
              {micMessage || (micLevel > 12 ? "입력이 감지되고 있습니다." : "소리가 작거나 입력이 없습니다.")}
            </p>
          </div>
        );

        const renderStartScreen = () => (
          <main className="app-shell center-shell">
            <section className="workspace fade-up">
              <aside className="workspace-side">
                <div>
                  <div className="mb-8 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-black text-blue-100">
                    음성 연습 도구
                  </div>
                  <h1 className="text-6xl font-black leading-tight tracking-normal">음성 연습</h1>
                  <p className="mt-5 max-w-sm text-base font-bold leading-7 text-blue-100">
                    발음 정확도와 읽기 속도를 한 번에 확인하는 수업용 연습 도구입니다.
                  </p>
                </div>

                <div className="grid gap-3 text-sm font-bold text-blue-100">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">발음 연습 문항 수 조절</div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">문장당 제한 시간 설정</div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4">참여 기록 자동 저장</div>
                </div>
              </aside>

              <div className="workspace-main flex items-center">
                <div className="w-full">
                  <div className="mb-8">
                    <p className="text-sm font-black uppercase text-blue-600">Start</p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">연습 정보를 입력하세요</h2>
                  </div>

                  <label className="block text-base font-black text-slate-700 mb-3">이름</label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setStartMessage("");
                    }}
                    placeholder="이름을 입력하세요"
                    className="mb-8 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                  {startMessage && <p className="-mt-5 mb-8 text-sm font-black text-red-600">{startMessage}</p>}

                  <button
                    onClick={enterPracticeMenu}
                    className="btn btn-primary w-full text-lg"
                  >
                    시작
                  </button>
                </div>
              </div>
            </section>
          </main>
        );

        const renderMenuScreen = () => (
          <main className="app-shell center-shell">
            <section className="compact-panel p-8">
              <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6">
                <p className="text-sm font-black text-blue-600">연습 메뉴</p>
                <h2 className="text-4xl font-black text-slate-950">{menuTitle}</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setScreen("pronunciation-intro")}
                  className="surface p-6 text-left hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100"
                >
                  <div className="mb-8 text-sm font-black text-blue-600">01</div>
                  <div className="text-2xl font-black text-slate-950">발음 연습</div>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-500">문장을 읽고 인식률을 확인합니다.</p>
                </button>
                <button
                  onClick={() => setScreen("speed-intro")}
                  className="surface p-6 text-left hover:border-teal-600 hover:shadow-xl hover:shadow-teal-100"
                >
                  <div className="mb-8 text-sm font-black text-teal-700">02</div>
                  <div className="text-2xl font-black text-slate-950">속도 연습</div>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                    인사, 글쓰기 안내, 발표 경청 중 하나를 골라 읽는 속도를 확인합니다.
                  </p>
                </button>
                {isAdminUser && (
                  <button
                    onClick={openAdminScreen}
                    className="surface p-6 text-left hover:border-slate-900 sm:col-span-2"
                  >
                    <div className="mb-5 text-sm font-black text-slate-500">관리</div>
                    <div className="text-xl font-black text-slate-950">관리자 페이지</div>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-500">관리자 코드와 참여 기록을 관리합니다.</p>
                  </button>
                )}
              </div>
            </section>
          </main>
        );

        const renderAdminScreen = () => (
          <main className="app-shell">
            <section className="compact-panel wide-panel relative mx-auto p-8">
              <HomeButton />
              <div className="mb-8 border-b border-slate-200 pb-6 pt-10 sm:pt-0">
                <p className="text-sm font-black text-slate-500">관리자</p>
                <h2 className="mt-2 text-4xl font-black text-slate-950">관리자 페이지</h2>
                <p className="mt-3 text-sm font-bold text-slate-500">관리자 코드, 연습 문장, 참여자별 누적 기록을 확인합니다.</p>
              </div>

              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-slate-950">관리자 코드 관리</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                    관리자 코드를 한 줄에 하나씩 입력하세요.
                  </p>
                </div>
                <textarea
                  value={adminCodesText}
                  onChange={(e) => setAdminCodesText(e.target.value)}
                  className="min-h-[140px] w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  placeholder="19001088"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={loadAdminConfig}
                    disabled={isAdminConfigLoading}
                    className={`btn text-base ${
                      isAdminConfigLoading ? "btn-muted" : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
                    }`}
                  >
                    다시 불러오기
                  </button>
                  <button
                    onClick={saveAdminConfig}
                    disabled={isAdminConfigLoading}
                    className={`btn text-base ${
                      isAdminConfigLoading ? "btn-muted" : "btn-primary"
                    }`}
                  >
                    관리자 코드 저장
                  </button>
                </div>
                {adminConfigMessage && (
                  <p className="mt-4 text-sm font-bold text-slate-600">{adminConfigMessage}</p>
                )}
              </div>

              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-slate-950">연습 문장 관리</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                    유형을 선택한 뒤 문단 단위로 입력하세요. 문단은 빈 줄로 구분됩니다.
                  </p>
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  {PRONUNCIATION_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setAdminSentenceCategory(category.id);
                        setAdminSentencesText(formatSentencesForCategory(sentencePool, category.id));
                        setAdminSentencesMessage(`${category.label} 문장을 편집합니다.`);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        adminSentenceCategory === category.id
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-900"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={adminSentencesText}
                  onChange={(e) => setAdminSentencesText(e.target.value)}
                  className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-bold leading-7 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  placeholder={`${CATEGORY_LABEL_BY_ID[adminSentenceCategory]} 문장을 문단 단위로 입력하세요.\n\n문단 사이에는 빈 줄을 넣어 구분합니다.`}
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={loadAdminSentences}
                    disabled={isAdminSentencesLoading}
                    className={`btn text-base ${
                      isAdminSentencesLoading ? "btn-muted" : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
                    }`}
                  >
                    문장 다시 불러오기
                  </button>
                  <button
                    onClick={saveAdminSentences}
                    disabled={isAdminSentencesLoading}
                    className={`btn text-base ${
                      isAdminSentencesLoading ? "btn-muted" : "btn-primary"
                    }`}
                  >
                    {CATEGORY_LABEL_BY_ID[adminSentenceCategory]} 문장 저장
                  </button>
                </div>
                {adminSentencesMessage && (
                  <p className="mt-4 text-sm font-bold text-slate-600">{adminSentencesMessage}</p>
                )}
              </div>

              <div>
                <button
                  onClick={loadAdminParticipants}
                  disabled={isAdminLoading}
                  className={`btn w-full text-base ${
                    isAdminLoading ? "btn-muted" : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  참여 기록 조회
                </button>
              </div>

              {adminMessage && <p className="mt-4 text-center text-sm font-bold text-gray-600">{adminMessage}</p>}

              <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[1fr_110px_300px_2fr] bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
                    <div>이름</div>
                    <div>총 참여횟수</div>
                    <div>인식률</div>
                    <div>참여일자</div>
                  </div>

                  {adminParticipants.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm font-bold text-gray-500">조회된 참여자가 없습니다.</div>
                  ) : (
                    adminParticipants.map((participant) => (
                      <div
                        key={participant.name}
                        className="grid grid-cols-[1fr_110px_300px_2fr] gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
                      >
                        <div className="font-black text-slate-950">{participant.name}</div>
                        <div className="font-bold">{participant.totalCount}회</div>
                        <div className="grid grid-cols-4 gap-2 font-bold">
                          <div>
                            <div className="text-xs text-slate-400">최근</div>
                            <div>{formatAccuracy(participant.accuracyStats?.recent ?? participant.lastAccuracy)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">최고</div>
                            <div>{formatAccuracy(participant.accuracyStats?.highest)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">최저</div>
                            <div>{formatAccuracy(participant.accuracyStats?.lowest)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">평균</div>
                            <div>{formatAccuracy(participant.accuracyStats?.average)}</div>
                          </div>
                        </div>
                        <div className="leading-6">
                          {(participant.participationDates || []).map((date) => (
                            <div key={date}>{date}</div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </main>
        );

        const renderPronunciationIntroScreen = () => (
          <main className="app-shell center-shell">
            <section className="compact-panel relative max-w-3xl p-8">
              <HomeButton />
              <div className="mb-8 border-b border-slate-200 pb-6 pt-10 sm:pt-0">
                <p className="text-sm font-black text-blue-600">발음</p>
                <h2 className="mt-2 text-4xl font-black text-slate-950">발음 연습 설정</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                  {pronunciationQuestionCount}개 문장을 문장당 {pronunciationTimeLimit}초 안에 읽습니다.
                </p>
              </div>

              <div className="mb-8 grid gap-5">
                <label className="quiet-surface block p-5">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-700">
                    <span>문항 수</span>
                    <span>{pronunciationQuestionCount}개</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={sentenceCountMax}
                    step="1"
                    value={pronunciationQuestionCount}
                    onChange={(e) => setPronunciationQuestionCount(Number(e.target.value))}
                    className="range-input w-full accent-indigo-700"
                  />
                </label>

                <label className="quiet-surface block p-5">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-700">
                    <span>문장당 제한 시간</span>
                    <span>{pronunciationTimeLimit}초</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="1"
                    value={pronunciationTimeLimit}
                    onChange={(e) => setPronunciationTimeLimit(Number(e.target.value))}
                    className="range-input w-full accent-indigo-700"
                  />
                </label>
              </div>

              <button
                onClick={beginPronunciationRecording}
                className="btn btn-primary w-full text-lg"
              >
                시작
              </button>
            </section>
          </main>
        );

        const renderPronunciationRecordingScreen = () => (
          <main className="app-shell center-shell">
            <section className="compact-panel wide-panel relative p-8">
              <HomeButton />
              <div className="grid gap-6 pt-10 sm:grid-cols-[160px_1fr] sm:pt-0">
                <div className="flex flex-col items-center justify-center rounded-3xl bg-blue-600 p-6 text-white">
                  <div className="text-sm font-black text-blue-100">남은 시간</div>
                  <div className="mt-2 text-7xl font-black">{pronunciationTimeLeft}</div>
                  <div className="mt-2 text-sm font-black text-blue-100">
                    {pronunciationIndex + 1} / {activePronunciationSentences.length}
                  </div>
                </div>
                <div className="surface flex min-h-[260px] flex-col justify-center p-8 text-center">
                  <div className="mb-4 text-sm font-black text-blue-600">연습 문장</div>
                  <div className="text-3xl font-black leading-relaxed text-slate-950">
                    {activePronunciationSentences[pronunciationIndex]}
                  </div>
                </div>
              </div>
              <p className="mt-6 text-center font-bold text-red-500">
                {recognitionMessage || "녹음이 진행 중입니다..."}
              </p>
              <MicLevelMeter />
            </section>
          </main>
        );

        const renderPronunciationResultScreen = () => (
          <main className="app-shell center-shell">
            <section className="compact-panel relative max-w-3xl p-8">
              <HomeButton />
              <div className="pt-10 text-center sm:pt-0">
                <p className="text-sm font-black text-blue-600">결과</p>
                <div className="mt-4 text-8xl font-black text-slate-950">{overallPronunciationAccuracy}%</div>
                <div className="mt-3 text-lg font-bold text-slate-500">
                  {overallPronunciationAccuracy}%가 인식되었습니다.
                </div>
              </div>
              {recordMessage && <p className="mb-6 text-center text-sm font-bold text-gray-500">{recordMessage}</p>}

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={retryPronunciationPractice}
                  className="btn btn-dark text-lg"
                >
                  재도전
                </button>
                <button
                  onClick={() => setShowPronunciationDetail((prev) => !prev)}
                  className="btn btn-primary text-lg"
                >
                  내 녹음 확인하기
                </button>
              </div>

              {showPronunciationDetail && (
                <div className="mt-8 grid gap-4">
                  {pronunciationResults.map((item, idx) => (
                    <div key={item.index} className="quiet-surface p-5">
                      <div className="font-black text-blue-700 mb-3">문장 {idx + 1}</div>
                      <p className="text-sm leading-7 text-slate-700">
                        <b>녹음한 내용:</b> {item.expected}
                      </p>
                      <p className="text-sm leading-7 text-slate-700">
                        <b>ai가 음성인식해서 입력된 문장내용:</b> {item.recognized || "인식된 내용이 없습니다."}
                      </p>
                      <p className="text-sm leading-7 text-slate-700">
                        <b>인식률:</b> {item.accuracy}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        );

        const renderSpeedIntroScreen = () => (
          <main className="app-shell center-shell">
            <section className="compact-panel relative max-w-3xl p-8">
              <HomeButton />
              <div className="mb-8 border-b border-slate-200 pb-6 pt-10 sm:pt-0">
                <p className="text-sm font-black text-teal-700">속도</p>
                <h2 className="mt-2 text-4xl font-black text-slate-950">속도 연습</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                  연습 종류를 고른 뒤 문장을 모두 읽으면 유형별 기준 속도와 비교합니다.
                </p>
              </div>

              <div className="mb-8 grid gap-3 sm:grid-cols-3">
                {SPEED_PRACTICE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedSpeedTypeId(type.id)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedSpeedTypeId === type.id
                        ? "border-teal-700 bg-teal-700 text-white shadow-lg shadow-teal-100"
                        : "border-slate-300 bg-white text-slate-700 hover:border-teal-600"
                    }`}
                  >
                    <div className="text-lg font-black">{type.label}</div>
                    <div className={`mt-2 text-sm font-bold ${
                      selectedSpeedTypeId === type.id ? "text-teal-50" : "text-slate-500"
                    }`}>
                      기준 {type.targetMinSeconds}-{type.targetMaxSeconds}초
                    </div>
                  </button>
                ))}
              </div>

              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="quiet-surface p-5">
                  <div className="text-sm font-black text-teal-700">01</div>
                  <p className="mt-3 text-sm font-bold text-slate-600">시작 버튼을 누릅니다.</p>
                </div>
                <div className="quiet-surface p-5">
                  <div className="text-sm font-black text-teal-700">02</div>
                  <p className="mt-3 text-sm font-bold text-slate-600">문장을 소리 내어 읽습니다.</p>
                </div>
                <div className="quiet-surface p-5">
                  <div className="text-sm font-black text-teal-700">03</div>
                  <p className="mt-3 text-sm font-bold text-slate-600">종료 버튼으로 결과를 봅니다.</p>
                </div>
              </div>
              <button
                onClick={() => setScreen("speed-practice")}
                className="btn btn-teal w-full text-lg"
              >
                연습하기
              </button>
            </section>
          </main>
        );

        const renderSpeedPracticeScreen = () => (
          <main className="app-shell">
            <section className="compact-panel wide-panel relative mx-auto p-8">
              <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-teal-700">속도 연습</p>
                  <h2 className="mt-2 text-4xl font-black text-slate-950">{selectedSpeedType.label}</h2>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    기준 {selectedSpeedType.targetMinSeconds}-{selectedSpeedType.targetMaxSeconds}초
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950 px-5 py-3 text-2xl font-black text-white">
                  {formatRunningTimer(speedCentiseconds)}
                </div>
              </div>

              <div className="surface p-8 text-xl font-bold leading-10 text-slate-900 whitespace-pre-line">
                {selectedSpeedType.text}
              </div>

              {recognitionMessage && (
                <p className="mt-5 text-center font-bold text-red-500">{recognitionMessage}</p>
              )}
              <MicLevelMeter />

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={beginSpeedRecording}
                  disabled={isSpeedRecording}
                  className={`btn text-lg ${
                    isSpeedRecording ? "btn-muted" : "btn-teal"
                  }`}
                >
                  시작하기
                </button>
                <button
                  onClick={endSpeedRecording}
                  disabled={!isSpeedRecording}
                  className={`btn text-lg ${
                    !isSpeedRecording ? "btn-muted" : "btn-danger"
                  }`}
                >
                  종료하기
                </button>
              </div>
            </section>
          </main>
        );

        const renderSpeedResultScreen = () => (
          <main className="app-shell center-shell">
            <section className="compact-panel relative max-w-3xl p-8">
              <HomeButton />
              <div className="pt-10 text-center sm:pt-0">
                <p className="text-sm font-black text-teal-700">결과</p>
                <p className="mt-2 text-base font-black text-teal-700">{selectedSpeedType.label}</p>
                <div className="mt-4 text-5xl font-black text-slate-950">{speedResult.title}</div>
                <div className="mt-4 text-4xl font-black text-teal-700">{formatResultTime(speedSeconds)}</div>
                <div className="mt-3 text-base font-bold text-slate-500">{speedResult.description}</div>
              </div>
              {recordMessage && <p className="mb-6 text-center text-sm font-bold text-gray-500">{recordMessage}</p>}

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={retrySpeedPractice}
                  className="btn btn-dark text-lg"
                >
                  재도전
                </button>
                <button
                  onClick={() => setShowSpeedDetail((prev) => !prev)}
                  className="btn btn-teal text-lg"
                >
                  내 녹음 확인하기
                </button>
              </div>

              {showSpeedDetail && (
                <div className="quiet-surface mt-8 p-5">
                  <p className="text-sm leading-7 mb-4 text-slate-700">
                    <b>녹음한 내용:</b>
                  </p>
                  <p className="text-sm leading-7 whitespace-pre-line mb-5 text-slate-700">{selectedSpeedType.text}</p>
                  <p className="text-sm leading-7 mb-4 text-slate-700">
                    <b>ai가 음성인식해서 입력된 문장내용:</b>
                  </p>
                  <p className="text-sm leading-7 whitespace-pre-line text-slate-700">
                    {speedRecognizedText || "인식된 내용이 없습니다."}
                  </p>
                </div>
              )}
            </section>
          </main>
        );

        if (screen === "start") return renderStartScreen();
        if (screen === "menu") return renderMenuScreen();
        if (screen === "admin") return renderAdminScreen();
        if (screen === "pronunciation-intro") return renderPronunciationIntroScreen();
        if (screen === "pronunciation-recording") return renderPronunciationRecordingScreen();
        if (screen === "pronunciation-result") return renderPronunciationResultScreen();
        if (screen === "speed-intro") return renderSpeedIntroScreen();
        if (screen === "speed-practice") return renderSpeedPracticeScreen();
        if (screen === "speed-result") return renderSpeedResultScreen();

        return null;
      }

      ReactDOM.createRoot(document.getElementById("root")).render(<VoicePracticeSite />);
