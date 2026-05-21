function MicLevelMeter({ micLevel, micMessage }) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-black text-slate-600">
        <span>마이크 입력</span>
        <span>{micLevel}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ${
            micLevel > 12 ? "bg-emerald-500" : "bg-slate-400"
          }`}
          style={{ width: `${micLevel}%` }}
        />
      </div>
      <p className={`mt-3 text-sm font-bold ${micMessage ? "text-red-500" : "text-slate-500"}`}>
        {micMessage || (micLevel > 12 ? "입력이 감지되고 있습니다." : "소리가 작거나 입력이 없습니다.")}
      </p>
    </div>
  );
}
