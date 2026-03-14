import { getMonthlyAttendancesWithRounding } from "@/actions/attendance";
import AttendanceTable from "@/components/AttendanceTable";
import { calculateBreakMinutes, getRoundedTimes } from "@/lib/time-utils";

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function HistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

  const { records, rounding } = await getMonthlyAttendancesWithRounding(year, month);

  const totalBreakMinutes = records.reduce((acc, r) => {
    return acc + calculateBreakMinutes(r.breaks ?? []);
  }, 0);

  // 拘束時間 = 丸め後の退勤 - 丸め後の出勤
  const totalGrossMinutes = records.reduce((acc, r) => {
    if (!r.clockOut) return acc;
    const { roundedClockIn, roundedClockOut } = getRoundedTimes(r.clockIn, r.clockOut, rounding);
    if (!roundedClockOut) return acc;
    return acc + Math.floor((roundedClockOut.getTime() - roundedClockIn.getTime()) / 60000);
  }, 0);

  // 実働時間 = 拘束時間 - 休憩時間
  const totalNetMinutes = totalGrossMinutes - totalBreakMinutes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">勤怠履歴</h1>
        <MonthSelector year={year} month={month} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-6 mb-4 text-sm">
          <div>
            <span className="text-gray-400">稼働日数：</span>
            <span className="font-medium">
              {records.filter((r) => r.clockOut).length}日
            </span>
          </div>
          <div>
            <span className="text-gray-400">拘束時間：</span>
            <span className="font-medium">
              {Math.floor(totalGrossMinutes / 60)}時間{totalGrossMinutes % 60}分
            </span>
          </div>
          <div>
            <span className="text-gray-400">実働時間：</span>
            <span className="font-medium">
              {Math.floor(totalNetMinutes / 60)}時間{totalNetMinutes % 60}分
            </span>
          </div>
          {totalBreakMinutes > 0 && (
            <div>
              <span className="text-gray-400">合計休憩：</span>
              <span className="font-medium">
                {Math.floor(totalBreakMinutes / 60)}時間{totalBreakMinutes % 60}分
              </span>
            </div>
          )}
        </div>
        <AttendanceTable records={records} rounding={rounding} />
      </div>
    </div>
  );
}

function MonthSelector({ year, month }: { year: number; month: number }) {
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="flex items-center gap-3">
      <a
        href={`/dashboard/history?year=${prev.year}&month=${prev.month}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        ←
      </a>
      <span className="text-sm font-medium text-gray-700 w-24 text-center">
        {year}年{month}月
      </span>
      <a
        href={`/dashboard/history?year=${next.year}&month=${next.month}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        →
      </a>
    </div>
  );
}
