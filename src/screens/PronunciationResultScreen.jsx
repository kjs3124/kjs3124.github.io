function PronunciationResultScreen({
  overallPronunciationAccuracy,
  recordMessage,
  showPronunciationDetail,
  pronunciationResults,
  onHome,
  onRetry,
  onToggleDetail
}) {
  return (
    <main className="app-shell center-shell">
      <section className="compact-panel relative max-w-3xl p-8">
        <HomeButton onClick={onHome} />
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
            onClick={onRetry}
            className="btn btn-dark text-lg"
          >
            재도전
          </button>
          <button
            onClick={onToggleDetail}
            className="btn btn-primary text-lg"
          >
            기록 확인하기
          </button>
        </div>

        {showPronunciationDetail && (
          <div className="mt-8 grid gap-4">
            {pronunciationResults.map((item, idx) => (
              <div key={item.index} className="quiet-surface p-5">
                <div className="font-black text-blue-700 mb-3">문장 {idx + 1}</div>
                <p className="text-sm leading-7 text-slate-700">
                  <b>원본 내용:</b> {item.expected}
                </p>
                <p className="text-sm leading-7 text-slate-700">
                  <b>음성인식해서 입력된 문장 내용:</b> {item.recognized || "인식된 내용이 없습니다."}
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
}
