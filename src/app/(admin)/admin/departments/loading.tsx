export default function DepartmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-32 bg-gray-200 rounded" />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
        <div className="flex gap-3">
          <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
          <div className="w-16 h-9 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-8 bg-gray-200 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
