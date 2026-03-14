import type { AttendanceAlert } from "@/lib/time-utils";

export default function AttendanceAlerts({ alerts }: { alerts: AttendanceAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {alerts.map((alert, i) => {
        const config = {
          late: { label: "遅刻", bg: "bg-red-50 text-red-600 border-red-200" },
          early_leave: { label: "早退", bg: "bg-amber-50 text-amber-600 border-amber-200" },
          overtime: { label: "残業", bg: "bg-blue-50 text-blue-600 border-blue-200" },
        }[alert.type];

        return (
          <span key={i} className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border ${config.bg}`}>
            {config.label}{alert.minutes}分
          </span>
        );
      })}
    </div>
  );
}
