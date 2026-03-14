"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { changePassword } from "@/actions/profile";

export default function ProfileClient({
  profile,
}: {
  profile: { name: string; email: string; employeeNumber: string; departmentName: string | null };
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, {
    success: false,
    message: "",
  });
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, {
    success: false,
    message: "",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">プロフィール設定</h1>

      {/* 基本情報カード */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
        <h2 className="text-sm font-medium text-gray-500 mb-4">基本情報</h2>

        {profileState.message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
              profileState.success
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {profileState.message}
          </div>
        )}

        <form action={profileAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">社員番号</label>
            <p className="px-3 py-2 text-sm text-gray-600 font-mono">{profile.employeeNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={profile.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <p className="px-3 py-2 text-sm text-gray-600">{profile.email}</p>
            <p className="text-xs text-gray-400 mt-1">変更は管理者にお問い合わせください</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属部署</label>
            <p className="px-3 py-2 text-sm text-gray-600">
              {profile.departmentName || "未割り当て"}
            </p>
          </div>
          <button
            type="submit"
            disabled={profilePending}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {profilePending ? "更新中..." : "プロフィールを更新"}
          </button>
        </form>
      </div>

      {/* パスワード変更カード */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
        <h2 className="text-sm font-medium text-gray-500 mb-4">パスワード変更</h2>

        {passwordState.message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
              passwordState.success
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {passwordState.message}
          </div>
        )}

        <form action={passwordAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現在のパスワード
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード（8文字以上）
            </label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード（確認）
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={passwordPending}
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {passwordPending ? "変更中..." : "パスワードを変更"}
          </button>
        </form>
      </div>
    </div>
  );
}
