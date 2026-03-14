export default function UsersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-9 bg-gray-200 rounded-lg w-20" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map((row) => (
            <div key={row} className="p-4 grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((col) => (
                <div key={col} className="h-5 bg-gray-100 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
