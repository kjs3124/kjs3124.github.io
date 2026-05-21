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
  loadMyRecordRequest,
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
        const [myRecord, setMyRecord] = useState(null);
        const [myRecordMessage, setMyRecordMessage] = useState("");
        const [isMyRecordLoading, setIsMyRecordLoading] = useState(false);
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
        const selectedSpeedText = useMemo(() => {
          const savedText = sentencePool
            .filter((item) => item.category === selectedSpeedType.id)
            .map((item) => item.text)
            .filter(Boolean)
            .join("\n\n")
            .trim();

          return savedText || selectedSpeedType.text;
        }, [sentencePool, selectedSpeedType]);
        const speedResult = useMemo(() => getSpeedResultText(speedSeconds, selectedSpeedType), [speedSeconds, selectedSpeedType]);
        const generalSentencePool = useMemo(() => (
          sentencePool.filter((item) => item.category === "general")
        ), [sentencePool]);
        const sentenceCountMax = Math.max(1, generalSentencePool.length);
        const isAdminGeneralSentence = adminSentenceCategory === "general";

        const formatAccuracy = (accuracy) => (
          typeof accuracy === "number" ? `${accuracy}%` : "-"
        );

        const getPracticeTypeLabel = (practiceType) => (
          practiceType === "speed" ? "속도 연습" : "발음 연습"
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

        const loadMyRecord = async () => {
          const trimmedName = name.trim();

          if (!trimmedName) {
            setMyRecord(null);
            setMyRecordMessage("");
            return;
          }

          setIsMyRecordLoading(true);
          setMyRecordMessage("");

          try {
            const data = await loadMyRecordRequest({
              name: trimmedName
            });
            setMyRecord(data.participant || null);
            setMyRecordMessage(data.participant ? "" : "아직 저장된 기록이 없습니다.");
          } catch (error) {
            setMyRecord(null);
            setMyRecordMessage(error.message || "내 기록을 불러오지 못했습니다.");
          } finally {
            setIsMyRecordLoading(false);
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
          const categorySentences = isAdminGeneralSentence
            ? adminSentencesText
              .split(/\n\s*\n+/)
              .map(parseSentenceParagraph)
              .filter((sentence) => sentence.text)
              .map((sentence) => ({
                category: adminSentenceCategory,
                text: sentence.text
              }))
            : [{
              category: adminSentenceCategory,
              text: adminSentencesText.trim()
            }].filter((sentence) => sentence.text);
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

        useEffect(() => {
          if (screen !== "menu" || isAdminUser) return;
          loadMyRecord();
        }, [screen, isAdminUser, name]);

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

        if (screen === "start") {
          return (
            <StartScreen
              name={name}
              startMessage={startMessage}
              onNameChange={(value) => {
                setName(value);
                setStartMessage("");
              }}
              onSubmit={enterPracticeMenu}
            />
          );
        }

        if (screen === "menu") {
          return (
            <MenuScreen
              menuTitle={menuTitle}
              isAdminUser={isAdminUser}
              myRecord={myRecord}
              myRecordMessage={myRecordMessage}
              isMyRecordLoading={isMyRecordLoading}
              onSelectPronunciation={() => setScreen("pronunciation-intro")}
              onSelectSpeed={() => setScreen("speed-intro")}
              onOpenAdmin={openAdminScreen}
              onRefreshMyRecord={loadMyRecord}
              formatAccuracy={formatAccuracy}
              getPracticeTypeLabel={getPracticeTypeLabel}
            />
          );
        }

        if (screen === "admin") {
          return (
            <AdminScreen
              adminCodesText={adminCodesText}
              adminConfigMessage={adminConfigMessage}
              adminSentenceCategory={adminSentenceCategory}
              adminSentencesText={adminSentencesText}
              adminSentencesMessage={adminSentencesMessage}
              adminParticipants={adminParticipants}
              adminMessage={adminMessage}
              isAdminConfigLoading={isAdminConfigLoading}
              isAdminSentencesLoading={isAdminSentencesLoading}
              isAdminLoading={isAdminLoading}
              isAdminGeneralSentence={isAdminGeneralSentence}
              sentencePool={sentencePool}
              categoryLabelById={CATEGORY_LABEL_BY_ID}
              onHome={goToPracticeMenu}
              onAdminCodesTextChange={setAdminCodesText}
              onLoadAdminConfig={loadAdminConfig}
              onSaveAdminConfig={saveAdminConfig}
              onAdminSentenceCategoryChange={setAdminSentenceCategory}
              onAdminSentencesTextChange={setAdminSentencesText}
              onAdminSentencesMessageChange={setAdminSentencesMessage}
              onLoadAdminSentences={loadAdminSentences}
              onSaveAdminSentences={saveAdminSentences}
              onLoadAdminParticipants={loadAdminParticipants}
              formatAccuracy={formatAccuracy}
              formatSentencesForCategory={formatSentencesForCategory}
            />
          );
        }

        if (screen === "pronunciation-intro") {
          return (
            <PronunciationIntroScreen
              pronunciationQuestionCount={pronunciationQuestionCount}
              pronunciationTimeLimit={pronunciationTimeLimit}
              sentenceCountMax={sentenceCountMax}
              onHome={goToPracticeMenu}
              onQuestionCountChange={setPronunciationQuestionCount}
              onTimeLimitChange={setPronunciationTimeLimit}
              onStart={beginPronunciationRecording}
            />
          );
        }

        if (screen === "pronunciation-recording") {
          return (
            <PronunciationRecordingScreen
              pronunciationTimeLeft={pronunciationTimeLeft}
              pronunciationIndex={pronunciationIndex}
              activePronunciationSentences={activePronunciationSentences}
              recognitionMessage={recognitionMessage}
              micLevel={micLevel}
              micMessage={micMessage}
              onHome={goToPracticeMenu}
            />
          );
        }

        if (screen === "pronunciation-result") {
          return (
            <PronunciationResultScreen
              overallPronunciationAccuracy={overallPronunciationAccuracy}
              recordMessage={recordMessage}
              showPronunciationDetail={showPronunciationDetail}
              pronunciationResults={pronunciationResults}
              onHome={goToPracticeMenu}
              onRetry={retryPronunciationPractice}
              onToggleDetail={() => setShowPronunciationDetail((prev) => !prev)}
            />
          );
        }

        if (screen === "speed-intro") {
          return (
            <SpeedIntroScreen
              speedPracticeTypes={SPEED_PRACTICE_TYPES}
              selectedSpeedTypeId={selectedSpeedTypeId}
              onHome={goToPracticeMenu}
              onSpeedTypeChange={setSelectedSpeedTypeId}
              onStart={() => setScreen("speed-practice")}
            />
          );
        }

        if (screen === "speed-practice") {
          return (
            <SpeedPracticeScreen
              selectedSpeedType={selectedSpeedType}
              selectedSpeedText={selectedSpeedText}
              speedCentiseconds={speedCentiseconds}
              isSpeedRecording={isSpeedRecording}
              recognitionMessage={recognitionMessage}
              micLevel={micLevel}
              micMessage={micMessage}
              onBegin={beginSpeedRecording}
              onEnd={endSpeedRecording}
              formatRunningTimer={formatRunningTimer}
            />
          );
        }

        if (screen === "speed-result") {
          return (
            <SpeedResultScreen
              selectedSpeedType={selectedSpeedType}
              selectedSpeedText={selectedSpeedText}
              speedResult={speedResult}
              speedSeconds={speedSeconds}
              recordMessage={recordMessage}
              showSpeedDetail={showSpeedDetail}
              speedRecognizedText={speedRecognizedText}
              onHome={goToPracticeMenu}
              onRetry={retrySpeedPractice}
              onToggleDetail={() => setShowSpeedDetail((prev) => !prev)}
              formatResultTime={formatResultTime}
            />
          );
        }

        return null;
      }

      ReactDOM.createRoot(document.getElementById("root")).render(<VoicePracticeSite />);
