function SpeedResultScreen({
  selectedSpeedType,
  selectedSpeedText,
  speedResult,
  speedSeconds,
  recordMessage,
  showSpeedDetail,
  speedRecognizedText,
  onHome,
  onRetry,
  onToggleDetail,
  formatResultTime
}) {
  return (
    <main className="app-shell center-shell">
      <section className="compact-panel relative max-w-3xl p-8">
        <HomeButton onClick={onHome} />
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
            onClick={onRetry}
            className="btn btn-dark text-lg"
          >
            재도전
          </button>
          <button
            onClick={onToggleDetail}
            className="btn btn-teal text-lg"
          >
            기록 확인하기
          </button>
        </div>

        {showSpeedDetail && (
          <div className="quiet-surface mt-8 p-5">
            <p className="text-sm leading-7 mb-4 text-slate-700">
              <b>원본 내용:</b>
            </p>
            <p className="text-sm leading-7 whitespace-pre-line mb-5 text-slate-700">{selectedSpeedText}</p>
            <p className="text-sm leading-7 mb-4 text-slate-700">
              <b>음성인식해서 입력된 문장 내용:</b>
            </p>
            <p className="text-sm leading-7 whitespace-pre-line text-slate-700">
              {speedRecognizedText || "인식된 내용이 없습니다."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
