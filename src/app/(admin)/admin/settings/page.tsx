import {
  getSystemWorkRule,
  getDepartmentWorkRules,
  getUserWorkRules,
  getAllUsersResolvedRules,
  upsertSystemWorkRule,
  upsertDepartmentWorkRule,
  upsertUserWorkRule,
  deleteWorkRule,
} from "@/actions/workrule";
import { getDepartmentOptions } from "@/actions/department";
import { getAllUsers } from "@/actions/admin";
import WorkRuleForm from "@/components/WorkRuleForm";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab ?? "system";

  const [systemRule, deptRules, userRules, departments, users] = await Promise.all([
    getSystemWorkRule(),
    getDepartmentWorkRules(),
    getUserWorkRules(),
    getDepartmentOptions(),
    getAllUsers(),
  ]);

  const usersWithRules = tab === "overview" ? await getAllUsersResolvedRules() : [];

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      tab === t
        ? "bg-white text-blue-600 border border-b-0 border-gray-200"
        : "text-gray-500 hover:text-gray-700"
    }`;

  // 既にルールが設定されている部署/ユーザーのIDセット
  const deptRuleMap = new Map(deptRules.map((r) => [r.departmentId, r]));
  const userRuleMap = new Map(userRules.map((r) => [r.userId, r]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">勤務ルール設定</h1>

      {/* タブ */}
      <div className="flex gap-1 border-b border-gray-200">
        <Link href="/admin/settings?tab=system" className={tabClass("system")}>
          システム
        </Link>
        <Link href="/admin/settings?tab=department" className={tabClass("department")}>
          部署別
        </Link>
        <Link href="/admin/settings?tab=user" className={tabClass("user")}>
          個人別
        </Link>
        <Link href="/admin/settings?tab=overview" className={tabClass("overview")}>
          適用状況
        </Link>
      </div>

      {/* システム設定 */}
      {tab === "system" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
          <h2 className="text-sm font-medium text-gray-700 mb-1">システムデフォルト</h2>
          <p className="text-xs text-gray-400 mb-4">
            部署・個人の設定がない場合に適用されます
          </p>
          <WorkRuleForm
            action={upsertSystemWorkRule}
            defaultValues={
              systemRule
                ? {
                    workStartTime: systemRule.workStartTime,
                    workEndTime: systemRule.workEndTime,
                    defaultBreakMinutes: systemRule.defaultBreakMinutes,
                    breakTiers: (systemRule.breakTiers as { thresholdHours: number; breakMinutes: number }[] | null) ?? [],
                    allowMultipleClockIns: systemRule.allowMultipleClockIns,
                    roundingUnit: systemRule.roundingUnit,
                    clockInRounding: systemRule.clockInRounding,
                    clockOutRounding: systemRule.clockOutRounding,
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* 部署別設定 */}
      {tab === "department" && (
        <div className="space-y-4">
          {departments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-400 text-sm">
              部署が登録されていません。
              <Link href="/admin/departments" className="text-blue-600 hover:underline ml-1">
                部署管理
              </Link>
              から追加してください。
            </div>
          ) : (
            departments.map((dept) => {
              const rule = deptRuleMap.get(dept.id);
              return (
                <div key={dept.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
                  <h2 className="text-sm font-medium text-gray-700 mb-3">{dept.name}</h2>
                  <WorkRuleForm
                    action={upsertDepartmentWorkRule}
                    hiddenFields={{ departmentId: dept.id }}
                    defaultValues={
                      rule
                        ? {
                            workStartTime: rule.workStartTime,
                            workEndTime: rule.workEndTime,
                            defaultBreakMinutes: rule.defaultBreakMinutes,
                            breakTiers: (rule.breakTiers as { thresholdHours: number; breakMinutes: number }[] | null) ?? [],
                            allowMultipleClockIns: rule.allowMultipleClockIns,
                            roundingUnit: rule.roundingUnit,
                            clockInRounding: rule.clockInRounding,
                            clockOutRounding: rule.clockOutRounding,
                          }
                        : undefined
                    }
                    deleteAction={rule ? deleteWorkRule : undefined}
                    deleteRuleId={rule?.id}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 個人別設定 */}
      {tab === "user" && (
        <div className="space-y-4">
          {/* 既存のユーザールール */}
          {userRules.length > 0 && (
            <div className="space-y-4">
              {userRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
                  <h2 className="text-sm font-medium text-gray-700 mb-1">
                    {rule.user?.name}
                  </h2>
                  <p className="text-xs text-gray-400 mb-3">{rule.user?.email}</p>
                  <WorkRuleForm
                    action={upsertUserWorkRule}
                    hiddenFields={{ userId: rule.userId! }}
                    defaultValues={{
                      workStartTime: rule.workStartTime,
                      workEndTime: rule.workEndTime,
                      defaultBreakMinutes: rule.defaultBreakMinutes,
                      breakTiers: (rule.breakTiers as { thresholdHours: number; breakMinutes: number }[] | null) ?? [],
                      allowMultipleClockIns: rule.allowMultipleClockIns,
                      roundingUnit: rule.roundingUnit,
                      clockInRounding: rule.clockInRounding,
                      clockOutRounding: rule.clockOutRounding,
                    }}
                    deleteAction={deleteWorkRule}
                    deleteRuleId={rule.id}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 未設定のユーザーを追加できるフォーム */}
          {(() => {
            const usersWithoutRule = users.filter((u) => !userRuleMap.has(u.id));
            if (usersWithoutRule.length === 0) return null;

            return (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
                <h2 className="text-sm font-medium text-gray-700 mb-3">個人ルールを追加</h2>
                <p className="text-xs text-gray-400 mb-3">
                  ユーザーを選択してルールを設定してください
                </p>
                <Link
                  href="/admin/settings/users"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  ユーザーを選択
                </Link>
              </div>
            );
          })()}
        </div>
      )}

      {/* 適用状況 */}
      {tab === "overview" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left text-gray-500 font-medium p-4">名前</th>
                <th className="text-left text-gray-500 font-medium p-4">部署</th>
                <th className="text-left text-gray-500 font-medium p-4">始業</th>
                <th className="text-left text-gray-500 font-medium p-4">終業</th>
                <th className="text-left text-gray-500 font-medium p-4">休憩</th>
                <th className="text-left text-gray-500 font-medium p-4">複数出勤</th>
                <th className="text-left text-gray-500 font-medium p-4">丸め</th>
                <th className="text-left text-gray-500 font-medium p-4">ルール元</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usersWithRules.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="p-4 text-gray-600">{u.departmentName || "—"}</td>
                  <td className="p-4 text-gray-700">{u.rule.workStartTime}</td>
                  <td className="p-4 text-gray-700">{u.rule.workEndTime}</td>
                  <td className="p-4 text-gray-700">
                    {u.rule.breakTiers.length > 0 ? (
                      <div className="text-xs space-y-0.5">
                        {u.rule.breakTiers
                          .sort((a, b) => a.thresholdHours - b.thresholdHours)
                          .map((t, i) => (
                            <div key={i}>{t.thresholdHours}h以上→{t.breakMinutes}分</div>
                          ))}
                        <div className="text-gray-400">その他→{u.rule.defaultBreakMinutes}分</div>
                      </div>
                    ) : (
                      <span>{u.rule.defaultBreakMinutes}分</span>
                    )}
                  </td>
                  <td className="p-4">{u.rule.allowMultipleClockIns ? "○" : "—"}</td>
                  <td className="p-4 text-xs text-gray-700">
                    {u.rule.roundingUnit <= 1 ? "1分" : (
                      <div>
                        <div>{u.rule.roundingUnit}分</div>
                        <div className="text-gray-400">
                          出勤:{u.rule.clockInRounding === "ceil" ? "切上" : u.rule.clockInRounding === "floor" ? "切捨" : "なし"}
                          {" / "}
                          退勤:{u.rule.clockOutRounding === "ceil" ? "切上" : u.rule.clockOutRounding === "floor" ? "切捨" : "なし"}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-4"><SourceBadge source={u.rule.source} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    DEFAULT: "bg-gray-100 text-gray-600",
    SYSTEM: "bg-blue-100 text-blue-600",
    DEPARTMENT: "bg-green-100 text-green-600",
    USER: "bg-purple-100 text-purple-600",
  };
  const labels: Record<string, string> = {
    DEFAULT: "デフォルト",
    SYSTEM: "システム",
    DEPARTMENT: "部署",
    USER: "個人",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[source] || styles.DEFAULT}`}>
      {labels[source] || source}
    </span>
  );
}
