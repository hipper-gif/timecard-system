import { getAllMonthlyAttendances, AttendanceWithUser } from "@/actions/admin";
import { getDepartmentOptions } from "@/actions/department";
import { getResolvedWorkRule } from "@/actions/workrule";
import { calculateBreakMinutes, detectAttendanceAlerts, getRoundedTimes, RoundingRule } from "@/lib/time-utils";
import AttendanceAlerts from "@/components/AttendanceAlerts";
import LocationDisplay from "@/components/LocationDisplay";

type Props = {
  searchParams: Promise<{ year?: string; month?: string; departmentId?: string }>;
};

export default async function AdminAttendancePage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const departmentId = params.departmentId || undefined;

  const [attendances, departments] = await Promise.all([
    getAllMonthlyAttendances(year, month, departmentId),
    getDepartmentOptions(),
  ]);

  // ユーザー別にグループ化
  const grouped = attendances.reduce(
    (acc, a) => {
      if (!acc[a.userId]) {
        acc[a.userId] = { user: a.user, records: [] };
      }
      acc[a.userId].records.push(a);
      return acc;
    },
    {} as Record<
      string,
      { user: AttendanceWithUser["user"]; records: AttendanceWithUser[] }
    >
  );

  const groupedEntries = Object.values(grouped);

  // ユーザーIDのユニークリストを取得してルールを解決
  const userIds = [...new Set(attendances.map(a => a.userId))];
  const ruleEntries = await Promise.all(
    userIds.map(async (uid) => [uid, await getResolvedWorkRule(uid)] as const)
  );
  const userRules = Object.fromEntries(ruleEntries);

  const csvHref = `/api/admin/attendance/export?year=${year}&month=${month}${departmentId ? `&departmentId=${departmentId}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">全員の勤怠</h1>
        <div className="flex items-center gap-3">
          <a
            href={csvHref}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            download
          >
            CSV出力
          </a>
          <MonthSelector year={year} month={month} departmentId={departmentId} basePath="/admin/attendance" />
        </div>
      </div>

      {departments.length > 0 && (
        <DepartmentFilter
          departments={departments}
          currentDepartmentId={departmentId}
          year={year}
          month={month}
        />
      )}

      {groupedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-sm">
          {year}年{month}月の勤怠記録はありません
        </div>
      ) : (
        groupedEntries.map(({ user, records }) => (
          <UserAttendanceCard key={user.id} user={user} records={records} rule={userRules[user.id]} />
        ))
      )}
    </div>
  );
}

function DepartmentFilter({
  departments,
  currentDepartmentId,
  year,
  month,
}: {
  departments: { id: string; name: string }[];
  currentDepartmentId: string | undefined;
  year: number;
  month: number;
}) {
  const base = `/admin/attendance?year=${year}&month=${month}`;

  const linkClass = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      selected
        ? "bg-blue-600 text-white"
        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 font-medium mr-1">部署:</span>
      <a href={base} className={linkClass(!currentDepartmentId)}>
        全員
      </a>
      {departments.map((d) => (
        <a
          key={d.id}
          href={`${base}&departmentId=${d.id}`}
          className={linkClass(currentDepartmentId === d.id)}
        >
          {d.name}
        </a>
      ))}
    </div>
  );
}

function MonthSelector({
  year,
  month,
  departmentId,
  basePath,
}: {
  year: number;
  month: number;
  departmentId: string | undefined;
  basePath: string;
}) {
  const deptParam = departmentId ? `&departmentId=${departmentId}` : "";
  const prev =
    month === 1
      ? { year: year - 1, month: 12 }
      : { year, month: month - 1 };
  const next =
    month === 12
      ? { year: year + 1, month: 1 }
      : { year, month: month + 1 };

  return (
    <div className="flex items-center gap-3">
      <a
        href={`${basePath}?year=${prev.year}&month=${prev.month}${deptParam}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        ←
      </a>
      <span className="text-sm font-medium text-gray-700 w-24 text-center">
        {year}年{month}月
      </span>
      <a
        href={`${basePath}?year=${next.year}&month=${next.month}${deptParam}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
      >
        →
      </a>
    </div>
  );
}

function UserAttendanceCard({
  user,
  records,
  rule,
}: {
  user: AttendanceWithUser["user"];
  records: AttendanceWithUser[];
  rule?: { workStartTime: string; workEndTime: string; roundingUnit: number; clockInRounding: string; clockOutRounding: string };
}) {
  const completedRecords = records.filter((r) => r.clockOut);
  const workDays = completedRecords.length;

  const rounding: RoundingRule = {
    roundingUnit: rule?.roundingUnit ?? 1,
    clockInRounding: (rule?.clockInRounding ?? "none") as "none" | "ceil" | "floor",
    clockOutRounding: (rule?.clockOutRounding ?? "none") as "none" | "ceil" | "floor",
  };

  const totalGrossMinutes = completedRecords.reduce((acc, r) => {
    const { roundedClockIn, roundedClockOut } = getRoundedTimes(r.clockIn, r.clockOut, rounding);
    if (!roundedClockOut) return acc;
    return acc + Math.floor((roundedClockOut.getTime() - roundedClockIn.getTime()) / 60000);
  }, 0);

  const totalBreakMinutes = completedRecords.reduce((acc, r) => {
    return acc + calculateBreakMinutes(r.breaks ?? []);
  }, 0);

  const totalNetMinutes = Math.max(0, totalGrossMinutes - totalBreakMinutes);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* カードヘッダー */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{user.name}</p>
            {user.department && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {user.department.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-gray-400 text-xs">稼働日数</p>
            <p className="font-semibold text-gray-800 mt-0.5">{workDays}日</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">拘束</p>
            <p className="font-semibold text-gray-800 mt-0.5">
              {Math.floor(totalGrossMinutes / 60)}h{String(totalGrossMinutes % 60).padStart(2, "0")}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">実働</p>
            <p className="font-semibold text-gray-800 mt-0.5">
              {Math.floor(totalNetMinutes / 60)}h{String(totalNetMinutes % 60).padStart(2, "0")}m
            </p>
          </div>
        </div>
      </div>

      {/* 詳細テーブル */}
      {records.length === 0 ? (
        <p className="p-4 text-sm text-gray-400 text-center">記録なし</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">日付</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">状態</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">出勤</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">退勤</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">休憩</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">拘束</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">実働</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">位置</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">備考</th>
                <th className="text-left text-gray-500 font-medium px-5 py-2.5">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((record) => {
                const breaks = record.breaks ?? [];
                const breakMins = calculateBreakMinutes(breaks);
                const { roundedClockIn, roundedClockOut } = getRoundedTimes(record.clockIn, record.clockOut, rounding);
                const grossMinutes = roundedClockOut
                  ? Math.floor((roundedClockOut.getTime() - roundedClockIn.getTime()) / 60000)
                  : null;
                const netMinutes = grossMinutes != null ? Math.max(0, grossMinutes - breakMins) : null;

                const alerts = rule ? detectAttendanceAlerts(record.clockIn, record.clockOut, rule) : [];

                const fmtTime = (d: Date) => d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
                const rawClockIn = new Date(record.clockIn);
                const rawClockOut = record.clockOut ? new Date(record.clockOut) : null;
                const clockInDiffers = rawClockIn.getTime() !== roundedClockIn.getTime();
                const clockOutDiffers = rawClockOut && roundedClockOut && rawClockOut.getTime() !== roundedClockOut.getTime();

                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700">
                      {rawClockIn.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-5 py-3">
                      <AttendanceAlerts alerts={alerts} />
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      <span>{fmtTime(roundedClockIn)}</span>
                      {clockInDiffers && (
                        <span className="block text-[10px] text-gray-400">{fmtTime(rawClockIn)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {roundedClockOut
                        ? (
                          <>
                            <span>{fmtTime(roundedClockOut)}</span>
                            {clockOutDiffers && rawClockOut && (
                              <span className="block text-[10px] text-gray-400">{fmtTime(rawClockOut)}</span>
                            )}
                          </>
                        )
                        : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                            勤務中
                          </span>
                        )}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {breaks.length > 0 ? (
                        <div>
                          <span>{breakMins}分</span>
                          {breaks.some(b => b.latitude != null) && (
                            <div className="flex items-center gap-1 mt-1">
                              {breaks.map((b, i) => (
                                <span key={b.id} className="inline-flex items-center gap-0.5">
                                  <LocationDisplay latitude={b.latitude} longitude={b.longitude} label={`休憩${i+1}開始`} />
                                  {b.breakEnd && b.endLatitude != null && (
                                    <LocationDisplay latitude={b.endLatitude} longitude={b.endLongitude} label={`休憩${i+1}終了`} />
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : "--"}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {grossMinutes != null
                        ? `${Math.floor(grossMinutes / 60)}時間${grossMinutes % 60}分`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {netMinutes != null
                        ? `${Math.floor(netMinutes / 60)}時間${netMinutes % 60}分`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <LocationDisplay latitude={record.clockInLat} longitude={record.clockInLng} label="出勤" />
                        {record.clockOut && (
                          <LocationDisplay latitude={record.clockOutLat} longitude={record.clockOutLng} label="退勤" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[120px] truncate">
                      {record.note || ""}
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`/admin/attendance/${record.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        編集
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
