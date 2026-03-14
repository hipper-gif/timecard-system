export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 bg-gray-200 rounded w-56 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-36" />
      </div>

      {/* 打刻カードスケルトン */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-20 mb-4" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-3 bg-gray-200 rounded w-10 mx-auto" />
              <div className="h-6 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <div className="h-12 bg-gray-200 rounded-xl w-24" />
          <div className="h-12 bg-gray-200 rounded-xl w-24" />
        </div>
      </div>

      {/* ステータスバッジスケルトン */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
        <div className="w-3 h-3 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}
