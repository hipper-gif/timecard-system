export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-36" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-6 mb-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-28" />
        </div>

        {/* テーブルスケルトン */}
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((col) => (
                <div key={col} className="h-5 bg-gray-100 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
