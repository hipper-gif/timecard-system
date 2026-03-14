import { getAllDepartments } from "@/actions/department";
import CreateDepartmentForm from "./CreateDepartmentForm";
import DeleteDepartmentButton from "./DeleteDepartmentButton";
import RenameDepartmentForm from "./RenameDepartmentForm";

export default async function DepartmentsPage() {
  const departments = await getAllDepartments();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">部署管理</h1>

      <CreateDepartmentForm />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left text-gray-500 font-medium p-4">部署名</th>
              <th className="text-left text-gray-500 font-medium p-4">所属人数</th>
              <th className="text-left text-gray-500 font-medium p-4">作成日</th>
              <th className="text-left text-gray-500 font-medium p-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                  部署が登録されていません
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <RenameDepartmentForm departmentId={dept.id} currentName={dept.name} />
                  </td>
                  <td className="p-4 text-gray-600">{dept._count.users}名</td>
                  <td className="p-4 text-gray-500">
                    {dept.createdAt.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="p-4">
                    <DeleteDepartmentButton
                      departmentId={dept.id}
                      userCount={dept._count.users}
                    />
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
