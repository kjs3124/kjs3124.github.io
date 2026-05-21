function StartScreen({
  name,
  startMessage,
  onNameChange,
  onSubmit
}) {
  return (
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
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="이름을 입력하세요"
              className="mb-8 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
            {startMessage && <p className="-mt-5 mb-8 text-sm font-black text-red-600">{startMessage}</p>}

            <button
              onClick={onSubmit}
              className="btn btn-primary w-full text-lg"
            >
              시작
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
