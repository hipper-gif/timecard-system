import { calculateBreakMinutes, getRoundedTimes } from "@/lib/time-utils";
import type { RoundingRule } from "@/lib/time-utils";
import LocationDisplay from "@/components/LocationDisplay";
import type { AttendanceRecord } from "@/types";

type Props = {
  records: AttendanceRecord[];
  rounding?: RoundingRule;
};

function fmt(date: Date | null, opts: Intl.DateTimeFormatOptions): string {
  if (!date) return "--";
  return new Date(date).toLocaleString("ja-JP", opts);
}

const dateOpts: Intl.DateTimeFormatOptions = {
  month: "numeric",
  day: "numeric",
  weekday: "short",
};

const timeOpts: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

export default function AttendanceTable({ records, rounding }: Props) {
  if (records.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-8">記録がありません</p>
    );
  }

  const defaultRounding: RoundingRule = { roundingUnit: 1, clockInRounding: "none", clockOutRounding: "none" };
  const rule = rounding ?? defaultRounding;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-gray-400 font-medium pb-3">日付</th>
            <th className="text-left text-gray-400 font-medium pb-3">出勤</th>
            <th className="text-left text-gray-400 font-medium pb-3">退勤</th>
            <th className="text-left text-gray-400 font-medium pb-3">休憩</th>
            <th className="text-left text-gray-400 font-medium pb-3">拘束</th>
            <th className="text-left text-gray-400 font-medium pb-3">実働</th>
            <th className="text-left text-gray-400 font-medium pb-3">備考</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map((r) => {
            const breaks = r.breaks ?? [];
            const breakMins = calculateBreakMinutes(breaks);
            const { roundedClockIn, roundedClockOut } = getRoundedTimes(r.clockIn, r.clockOut, rule);

            // 拘束時間（丸め後の退勤 - 丸め後の出勤、休憩引かない）
            const grossMinutes = roundedClockOut
              ? Math.floor((roundedClockOut.getTime() - roundedClockIn.getTime()) / 60000)
              : null;
            // 実働時間（拘束 - 休憩）
            const netMinutes = grossMinutes != null ? Math.max(0, grossMinutes - breakMins) : null;

            return (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 text-gray-700">
                  {fmt(r.clockIn, dateOpts)}
                </td>
                <td className="py-3 text-gray-700">
                  {fmt(roundedClockIn, timeOpts)}
                  {roundedClockIn.getTime() !== new Date(r.clockIn).getTime() && (
                    <span className="block text-xs text-gray-400">({fmt(r.clockIn, timeOpts)})</span>
                  )}
                </td>
                <td className="py-3 text-gray-700">
                  {roundedClockOut ? (
                    <>
                      {fmt(roundedClockOut, timeOpts)}
                      {r.clockOut && roundedClockOut.getTime() !== new Date(r.clockOut).getTime() && (
                        <span className="block text-xs text-gray-400">({fmt(r.clockOut, timeOpts)})</span>
                      )}
                    </>
                  ) : (
                    <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-0.5 rounded-full">
                      勤務中
                    </span>
                  )}
                </td>
                <td className="py-3 text-gray-700">
                  {breaks.length > 0 ? (
                    <div>
                      <span>{breakMins}分</span>
                      {breaks.some(b => b.latitude != null) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {breaks.map((b, i) => (
                            b.latitude != null && (
                              <LocationDisplay key={b.id} latitude={b.latitude} longitude={b.longitude} label={`休${i+1}`} />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ) : "--"}
                </td>
                <td className="py-3 text-gray-700">
                  {grossMinutes != null
                    ? `${Math.floor(grossMinutes / 60)}時間${grossMinutes % 60}分`
                    : "--"}
                </td>
                <td className="py-3 text-gray-700">
                  {netMinutes != null
                    ? `${Math.floor(netMinutes / 60)}時間${netMinutes % 60}分`
                    : "--"}
                </td>
                <td className="py-3 text-gray-500 text-xs">
                  {r.note || "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
