import { getTodayAttendance } from "@/actions/attendance";
import { getResolvedWorkRule } from "@/actions/workrule";
import ClockButton from "@/components/ClockButton";
import AttendanceAlerts from "@/components/AttendanceAlerts";
import LocationDisplay from "@/components/LocationDisplay";
import { getSession } from "@/lib/cached-auth";
import { detectAttendanceAlerts, getRoundedTimes, RoundingRule } from "@/lib/time-utils";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m}分`;
}

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session?.user?.id ?? "";
  const todayData = await getTodayAttendance();
  const rule = await getResolvedWorkRule(userId);
  const rounding: RoundingRule = {
    roundingUnit: rule.roundingUnit,
    clockInRounding: rule.clockInRounding,
    clockOutRounding: rule.clockOutRounding,
  };

  const alerts = todayData.attendance
    ? detectAttendanceAlerts(todayData.attendance.clockIn, todayData.attendance.clockOut, rule)
    : [];

  // 丸め後の出退勤時刻を計算
  const roundedTimes = todayData.attendance
    ? getRoundedTimes(
        new Date(todayData.attendance.clockIn),
        todayData.attendance.clockOut ? new Date(todayData.attendance.clockOut) : null,
        rounding
      )
    : null;
  const roundedClockIn = roundedTimes?.roundedClockIn ?? null;
  const roundedClockOut = roundedTimes?.roundedClockOut ?? null;

  // 拘束時間（休憩引き前）= 丸め後の退勤 - 丸め後の出勤
  const totalMinutes =
    roundedClockOut && roundedClockIn
      ? Math.floor(
          (roundedClockOut.getTime() - roundedClockIn.getTime()) / 60000
        )
      : null;

  // 実働時間 = 拘束時間 - 休憩時間
  const netMinutes =
    totalMinutes != null ? totalMinutes - (todayData.breakMinutes ?? 0) : null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          おはようございます、{session?.user?.name} さん
        </h1>
        <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
      </div>

      {/* 打刻カード */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 mb-4">本日の勤怠</h2>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">出勤</p>
            {todayData.attendance?.clockIn && roundedClockIn ? (
              <>
                <p className="text-base sm:text-xl font-semibold text-gray-900">
                  {formatTime(roundedClockIn)}
                </p>
                {roundedClockIn.getTime() !== new Date(todayData.attendance.clockIn).getTime() && (
                  <p className="text-xs text-gray-400">({formatTime(todayData.attendance.clockIn)})</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-xl font-semibold text-gray-900">--:--</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">退勤</p>
            {todayData.attendance?.clockOut && roundedClockOut ? (
              <>
                <p className="text-base sm:text-xl font-semibold text-gray-900">
                  {formatTime(roundedClockOut)}
                </p>
                {roundedClockOut.getTime() !== new Date(todayData.attendance.clockOut).getTime() && (
                  <p className="text-xs text-gray-400">({formatTime(todayData.attendance.clockOut)})</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-xl font-semibold text-gray-900">--:--</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">休憩</p>
            <p className="text-sm sm:text-lg font-semibold text-gray-900">
              {todayData.breakCount > 0
                ? `${todayData.breakMinutes ?? 0}分 (${todayData.breakCount}回)`
                : "--"}
            </p>
            {todayData.attendance?.breaks && todayData.attendance.breaks.some(b => b.latitude != null) && (
              <div className="flex items-center gap-1 mt-1 justify-center">
                {todayData.attendance.breaks.map((b, i) => (
                  <span key={b.id} className="inline-flex items-center gap-0.5">
                    <LocationDisplay latitude={b.latitude} longitude={b.longitude} label={`休憩${i+1}`} />
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">拘束</p>
            <p className="text-sm sm:text-xl font-semibold text-gray-900">
              {totalMinutes != null
                ? formatMinutes(totalMinutes)
                : "--"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">実働</p>
            <p className="text-sm sm:text-xl font-semibold text-gray-900">
              {netMinutes != null
                ? formatMinutes(netMinutes)
                : "--"}
            </p>
          </div>
        </div>

        <ClockButton status={todayData.status} />
      </div>

      {/* ステータスバッジ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${
            todayData.status === "on_break"
              ? "bg-orange-500 animate-pulse"
              : todayData.status === "clocked_in"
              ? "bg-green-500 animate-pulse"
              : todayData.status === "clocked_out"
              ? "bg-gray-400"
              : "bg-yellow-400"
          }`}
        />
        <p className="text-sm font-medium text-gray-700">
          {todayData.status === "on_break"
            ? "休憩中"
            : todayData.status === "clocked_in"
            ? "勤務中"
            : todayData.status === "clocked_out"
            ? "退勤済み"
            : "未出勤"}
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-2">本日の勤怠状況</p>
          <AttendanceAlerts alerts={alerts} />
        </div>
      )}
    </div>
  );
}
