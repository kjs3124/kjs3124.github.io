function PronunciationIntroScreen({
  pronunciationQuestionCount,
  pronunciationTimeLimit,
  sentenceCountMax,
  onHome,
  onQuestionCountChange,
  onTimeLimitChange,
  onStart
}) {
  return (
    <main className="app-shell center-shell">
      <section className="compact-panel relative max-w-3xl p-8">
        <HomeButton onClick={onHome} />
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
              onChange={(e) => onQuestionCountChange(Number(e.target.value))}
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
              onChange={(e) => onTimeLimitChange(Number(e.target.value))}
              className="range-input w-full accent-indigo-700"
            />
          </label>
        </div>

        <button
          onClick={onStart}
          className="btn btn-primary w-full text-lg"
        >
          시작
        </button>
      </section>
    </main>
  );
}
