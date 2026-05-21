function SpeedPracticeScreen({
  selectedSpeedType,
  selectedSpeedText,
  speedCentiseconds,
  isSpeedRecording,
  recognitionMessage,
  micLevel,
  micMessage,
  onBegin,
  onEnd,
  formatRunningTimer
}) {
  return (
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
          {selectedSpeedText}
        </div>

        {recognitionMessage && (
          <p className="mt-5 text-center font-bold text-red-500">{recognitionMessage}</p>
        )}
        <MicLevelMeter micLevel={micLevel} micMessage={micMessage} />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={onBegin}
            disabled={isSpeedRecording}
            className={`btn text-lg ${
              isSpeedRecording ? "btn-muted" : "btn-teal"
            }`}
          >
            시작하기
          </button>
          <button
            onClick={onEnd}
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
}
