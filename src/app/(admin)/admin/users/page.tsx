import { getAllUsers } from "@/actions/admin";
import { getDepartmentOptions } from "@/actions/department";
import Link from "next/link";
import UserActionsRow from "@/components/UserActionsRow";
import DeleteUserButton from "@/components/DeleteUserButton";
import AssignDepartmentSelect from "@/components/AssignDepartmentSelect";
import StatusToggle from "@/components/StatusToggle";
import UserFilter from "@/components/UserFilter";

type Props = {
  searchParams: Promise<{ dept?: string; inactive?: string }>;
};

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const deptFilter = params.dept || "";
  const showInactive = params.inactive === "1";

  const [allUsers, departments] = await Promise.all([
    getAllUsers(),
    getDepartmentOptions(),
  ]);

  const users = allUsers.filter((user) => {
    if (!showInactive && !user.isActive) return false;
    if (deptFilter && user.departmentId !== deptFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ユーザー管理</h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          新規追加
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <UserFilter departments={departments} />
        <span className="text-sm text-gray-500">{users.length}件表示</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left text-gray-500 font-medium p-4">社員番号</th>
              <th className="text-left text-gray-500 font-medium p-4">名前</th>
              <th className="text-left text-gray-500 font-medium p-4">メールアドレス</th>
              <th className="text-left text-gray-500 font-medium p-4">ロール</th>
              <th className="text-left text-gray-500 font-medium p-4">部署</th>
              <th className="text-left text-gray-500 font-medium p-4">キオスク</th>
              <th className="text-left text-gray-500 font-medium p-4">登録日</th>
              <th className="text-left text-gray-500 font-medium p-4">状態</th>
              <th className="text-left text-gray-500 font-medium p-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-400 text-sm">
                  該当するユーザーがいません
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.isActive ? "opacity-50" : ""}`}>
                  <td className="p-4 text-gray-600 font-mono text-sm">{user.employeeNumber}</td>
                  <td className="p-4 font-medium text-gray-900">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <UserActionsRow user={user} />
                  </td>
                  <td className="p-4">
                    <AssignDepartmentSelect
                      userId={user.id}
                      currentDepartmentId={user.departmentId}
                      departments={departments}
                    />
                  </td>
                  <td className="p-4 text-gray-500 font-mono text-sm">
                    {user.kioskCode || <span className="text-gray-300">未設定</span>}
                  </td>
                  <td className="p-4 text-gray-500">
                    {user.createdAt.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="p-4">
                    <StatusToggle userId={user.id} isActive={user.isActive} />
                  </td>
                  <td className="p-4">
                    <a href={`/admin/users/${user.id}/edit`} className="text-xs text-blue-600 hover:underline mr-2">編集</a>
                    <DeleteUserButton userId={user.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
