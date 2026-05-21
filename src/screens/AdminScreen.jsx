function AdminScreen({
  adminCodesText,
  adminConfigMessage,
  adminSentenceCategory,
  adminSentencesText,
  adminSentencesMessage,
  adminParticipants,
  adminMessage,
  isAdminConfigLoading,
  isAdminSentencesLoading,
  isAdminLoading,
  isAdminGeneralSentence,
  sentencePool,
  categoryLabelById,
  onHome,
  onAdminCodesTextChange,
  onLoadAdminConfig,
  onSaveAdminConfig,
  onAdminSentenceCategoryChange,
  onAdminSentencesTextChange,
  onAdminSentencesMessageChange,
  onLoadAdminSentences,
  onSaveAdminSentences,
  onLoadAdminParticipants,
  formatAccuracy,
  formatSentencesForCategory
}) {
  return (
    <main className="app-shell">
      <section className="compact-panel wide-panel relative mx-auto p-8">
        <HomeButton onClick={onHome} />
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
            onChange={(e) => onAdminCodesTextChange(e.target.value)}
            className="min-h-[140px] w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder="19001088"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={onLoadAdminConfig}
              disabled={isAdminConfigLoading}
              className={`btn text-base ${
                isAdminConfigLoading ? "btn-muted" : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
              }`}
            >
              다시 불러오기
            </button>
            <button
              onClick={onSaveAdminConfig}
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
              {isAdminGeneralSentence
                ? "일반 문항은 문단 단위로 입력하세요. 문단은 빈 줄로 구분됩니다."
                : "속도 연습 문항은 입력한 전체 내용을 그대로 사용합니다."}
            </p>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            {window.VoicePracticeConstants.PRONUNCIATION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onAdminSentenceCategoryChange(category.id);
                  onAdminSentencesTextChange(formatSentencesForCategory(sentencePool, category.id));
                  onAdminSentencesMessageChange(`${category.label} 문장을 편집합니다.`);
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
            onChange={(e) => onAdminSentencesTextChange(e.target.value)}
            className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-bold leading-7 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            placeholder={
              isAdminGeneralSentence
                ? `${categoryLabelById[adminSentenceCategory]} 문장을 문단 단위로 입력하세요.\n\n문단 사이에는 빈 줄을 넣어 구분합니다.`
                : `${categoryLabelById[adminSentenceCategory]} 속도 연습에 사용할 전체 내용을 입력하세요.`
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={onLoadAdminSentences}
              disabled={isAdminSentencesLoading}
              className={`btn text-base ${
                isAdminSentencesLoading ? "btn-muted" : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
              }`}
            >
              문장 다시 불러오기
            </button>
            <button
              onClick={onSaveAdminSentences}
              disabled={isAdminSentencesLoading}
              className={`btn text-base ${
                isAdminSentencesLoading ? "btn-muted" : "btn-primary"
              }`}
            >
              {categoryLabelById[adminSentenceCategory]} 문장 저장
            </button>
          </div>
          {adminSentencesMessage && (
            <p className="mt-4 text-sm font-bold text-slate-600">{adminSentencesMessage}</p>
          )}
        </div>

        <div>
          <button
            onClick={onLoadAdminParticipants}
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
}
