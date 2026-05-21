function MyRecordPanel({
  myRecord,
  myRecordMessage,
  isMyRecordLoading,
  onRefresh,
  formatAccuracy,
  getPracticeTypeLabel
}) {
  const records = Array.isArray(myRecord?.records) ? myRecord.records : [];
  const recentRecords = records.slice(0, 5);

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">내 기록</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">누적 참여 기록</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isMyRecordLoading}
          className={`rounded-2xl border px-4 py-2 text-sm font-black transition ${
            isMyRecordLoading
              ? "border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-300 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-600"
          }`}
        >
          {isMyRecordLoading ? "조회 중" : "새로고침"}
        </button>
      </div>

      {myRecord ? (
        <>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="quiet-surface p-4">
              <div className="text-xs font-black text-slate-400">총 참여</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{myRecord.totalCount || 0}회</div>
            </div>
            <div className="quiet-surface p-4">
              <div className="text-xs font-black text-slate-400">최근</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{formatAccuracy(myRecord.accuracyStats?.recent ?? myRecord.lastAccuracy)}</div>
            </div>
            <div className="quiet-surface p-4">
              <div className="text-xs font-black text-slate-400">최고</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{formatAccuracy(myRecord.accuracyStats?.highest)}</div>
            </div>
            <div className="quiet-surface p-4">
              <div className="text-xs font-black text-slate-400">최저</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{formatAccuracy(myRecord.accuracyStats?.lowest)}</div>
            </div>
            <div className="quiet-surface p-4">
              <div className="text-xs font-black text-slate-400">평균</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{formatAccuracy(myRecord.accuracyStats?.average)}</div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[1fr_110px_90px] bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
                <div>참여일자</div>
                <div>연습</div>
                <div>인식률</div>
              </div>
              {recentRecords.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm font-bold text-slate-500">상세 기록이 없습니다.</div>
              ) : (
                recentRecords.map((record, index) => (
                  <div
                    key={`${record.participatedAt}-${index}`}
                    className="grid grid-cols-[1fr_110px_90px] border-t border-slate-200 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <div>{record.participatedAt || "-"}</div>
                    <div>{getPracticeTypeLabel(record.practiceType)}</div>
                    <div>{formatAccuracy(record.accuracy)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
          {isMyRecordLoading ? "내 기록을 불러오는 중입니다." : myRecordMessage || "아직 저장된 기록이 없습니다."}
        </div>
      )}

      {myRecordMessage && myRecord && (
        <p className="mt-4 text-sm font-bold text-slate-500">{myRecordMessage}</p>
      )}
    </div>
  );
}

function MenuScreen({
  menuTitle,
  isAdminUser,
  myRecord,
  myRecordMessage,
  isMyRecordLoading,
  onSelectPronunciation,
  onSelectSpeed,
  onOpenAdmin,
  onRefreshMyRecord,
  formatAccuracy,
  getPracticeTypeLabel
}) {
  return (
    <main className="app-shell center-shell">
      <section className="compact-panel p-8">
        <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6">
          <p className="text-sm font-black text-blue-600">연습 메뉴</p>
          <h2 className="text-4xl font-black text-slate-950">{menuTitle}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={onSelectPronunciation}
            className="surface p-6 text-left hover:border-blue-500 hover:shadow-xl hover:shadow-blue-100"
          >
            <div className="mb-8 text-sm font-black text-blue-600">01</div>
            <div className="text-2xl font-black text-slate-950">발음 연습</div>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-500">문장을 읽고 인식률을 확인합니다.</p>
          </button>
          <button
            onClick={onSelectSpeed}
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
              onClick={onOpenAdmin}
              className="surface p-6 text-left hover:border-slate-900 sm:col-span-2"
            >
              <div className="mb-5 text-sm font-black text-slate-500">관리</div>
              <div className="text-xl font-black text-slate-950">관리자 페이지</div>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-500">관리자 코드와 참여 기록을 관리합니다.</p>
            </button>
          )}
        </div>

        {!isAdminUser && (
          <MyRecordPanel
            myRecord={myRecord}
            myRecordMessage={myRecordMessage}
            isMyRecordLoading={isMyRecordLoading}
            onRefresh={onRefreshMyRecord}
            formatAccuracy={formatAccuracy}
            getPracticeTypeLabel={getPracticeTypeLabel}
          />
        )}
      </section>
    </main>
  );
}
