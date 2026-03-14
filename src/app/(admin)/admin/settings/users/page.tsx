import { getAllUsers } from "@/actions/admin";
import { getUserWorkRules, upsertUserWorkRule, deleteWorkRule } from "@/actions/workrule";
import WorkRuleForm from "@/components/WorkRuleForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UserSettingsPage() {
  const [users, existingRules] = await Promise.all([
    getAllUsers(),
    getUserWorkRules(),
  ]);

  const ruleMap = new Map(existingRules.map((r) => [r.userId, r]));
  const usersWithoutRule = users.filter((u) => !ruleMap.has(u.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/settings?tab=user"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 勤務ルール設定
        </Link>
        <h1 className="text-xl font-bold text-gray-900">個人別ルール設定</h1>
      </div>

      {usersWithoutRule.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-400 text-sm">
          すべてのユーザーに個人ルールが設定済みです
        </div>
      ) : (
        <div className="space-y-4">
          {usersWithoutRule.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-medium text-gray-700">{user.name}</h2>
                {user.department && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {user.department.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">{user.email}</p>
              <WorkRuleForm
                action={upsertUserWorkRule}
                hiddenFields={{ userId: user.id }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 既存の個人ルール一覧 */}
      {existingRules.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 pt-4">設定済みの個人ルール</h2>
          <div className="space-y-4">
            {existingRules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
                <h2 className="text-sm font-medium text-gray-700 mb-1">{rule.user?.name}</h2>
                <p className="text-xs text-gray-400 mb-3">{rule.user?.email}</p>
                <WorkRuleForm
                  action={upsertUserWorkRule}
                  hiddenFields={{ userId: rule.userId! }}
                  defaultValues={{
                    workStartTime: rule.workStartTime,
                    workEndTime: rule.workEndTime,
                    defaultBreakMinutes: rule.defaultBreakMinutes,
                    allowMultipleClockIns: rule.allowMultipleClockIns,
                  }}
                  deleteAction={deleteWorkRule}
                  deleteRuleId={rule.id}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
