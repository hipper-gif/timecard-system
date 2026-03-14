"use client";

import { useActionState } from "react";
import { createUser } from "@/actions/admin";
import Link from "next/link";

type Props = {
  departments: { id: string; name: string }[];
};

export default function NewUserForm({ departments }: Props) {
  const [state, action, isPending] = useActionState(createUser, {
    success: false,
    message: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← ユーザー管理
        </Link>
        <h1 className="text-xl font-bold text-gray-900">ユーザー追加</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
        {state.message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              state.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {state.message}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              社員番号
            </label>
            <input
              name="employeeNumber"
              type="text"
              required
              placeholder="例: EMP001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（8文字以上）
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              キオスクコード（4桁数字・任意）
            </label>
            <input
              name="kioskCode"
              type="text"
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="例: 0001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ロール
            </label>
            <select
              name="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EMPLOYEE">一般</option>
              <option value="ADMIN">管理者</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              部署（任意）
            </label>
            <select
              name="departmentId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">未割り当て</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "作成中..." : "ユーザーを作成"}
          </button>
        </form>

        {state.success && (
          <div className="mt-4 text-center">
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:underline"
            >
              ユーザー管理に戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
