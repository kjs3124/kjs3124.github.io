function PronunciationRecordingScreen({
  pronunciationTimeLeft,
  pronunciationIndex,
  activePronunciationSentences,
  recognitionMessage,
  micLevel,
  micMessage,
  onHome
}) {
  return (
    <main className="app-shell center-shell">
      <section className="compact-panel wide-panel relative p-8">
        <HomeButton onClick={onHome} />
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
        <MicLevelMeter micLevel={micLevel} micMessage={micMessage} />
      </section>
    </main>
  );
}
