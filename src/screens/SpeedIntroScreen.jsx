function SpeedIntroScreen({
  speedPracticeTypes,
  selectedSpeedTypeId,
  onHome,
  onSpeedTypeChange,
  onStart
}) {
  return (
    <main className="app-shell center-shell">
      <section className="compact-panel relative max-w-3xl p-8">
        <HomeButton onClick={onHome} />
        <div className="mb-8 border-b border-slate-200 pb-6 pt-10 sm:pt-0">
          <p className="text-sm font-black text-teal-700">속도</p>
          <h2 className="mt-2 text-4xl font-black text-slate-950">속도 연습</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
            연습 종류를 고른 뒤 문장을 모두 읽으면 유형별 기준 속도와 비교합니다.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {speedPracticeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSpeedTypeChange(type.id)}
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
          onClick={onStart}
          className="btn btn-teal w-full text-lg"
        >
          연습하기
        </button>
      </section>
    </main>
  );
}
