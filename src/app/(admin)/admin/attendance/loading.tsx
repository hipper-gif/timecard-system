export default function AdminAttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-28" />
        <div className="h-8 bg-gray-200 rounded w-40" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-36" />
            </div>
            <div className="flex gap-6">
              <div className="space-y-1 text-center">
                <div className="h-3 bg-gray-100 rounded w-12" />
                <div className="h-5 bg-gray-200 rounded w-8 mx-auto" />
              </div>
              <div className="space-y-1 text-center">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded w-20 mx-auto" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((row) => (
              <div key={row} className="px-5 py-3 grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((col) => (
                  <div key={col} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
