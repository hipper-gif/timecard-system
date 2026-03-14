"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";

export default function Navbar({
  userName,
  userRole,
}: {
  userName: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = userRole === "ADMIN";

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname === path
        ? "text-blue-600"
        : "text-gray-600 hover:text-gray-900"
    }`;

  const mobileLinkClass = (path: string) =>
    `block py-2 px-3 rounded-lg text-sm font-medium ${
      pathname === path
        ? "text-blue-600 bg-blue-50"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* ロゴ + デスクトップリンク */}
        <div className="flex items-center gap-6">
          <Image src="/logo.png" alt="SmartClock" width={140} height={40} className="h-8 w-auto" />
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/clock" className={linkClass("/clock")}>
              打刻
            </Link>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              ダッシュボード
            </Link>
            <Link href="/dashboard/history" className={linkClass("/dashboard/history")}>
              勤怠履歴
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/users" className={linkClass("/admin/users")}>
                  ユーザー管理
                </Link>
                <Link href="/admin/departments" className={linkClass("/admin/departments")}>
                  部署管理
                </Link>
                <Link href="/admin/attendance" className={linkClass("/admin/attendance")}>
                  全員の勤怠
                </Link>
                <Link href="/admin/settings" className={linkClass("/admin/settings")}>
                  勤務ルール
                </Link>
              </>
            )}
          </div>
        </div>

        {/* デスクトップ右側 */}
        <div className="hidden sm:flex items-center gap-4">
          {isAdmin && (
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
              管理者
            </span>
          )}
          <Link href="/dashboard/profile" className={linkClass("/dashboard/profile")}>
            {userName}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>

        {/* モバイルハンバーガー */}
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニューを開く"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link href="/clock" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/clock")}>
            打刻
          </Link>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/dashboard")}>
            ダッシュボード
          </Link>
          <Link href="/dashboard/history" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/dashboard/history")}>
            勤怠履歴
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin/users" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/admin/users")}>
                ユーザー管理
              </Link>
              <Link href="/admin/departments" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/admin/departments")}>
                部署管理
              </Link>
              <Link href="/admin/attendance" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/admin/attendance")}>
                全員の勤怠
              </Link>
              <Link href="/admin/settings" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/admin/settings")}>
                勤務ルール
              </Link>
            </>
          )}
          <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className={mobileLinkClass("/dashboard/profile")}>
            プロフィール
          </Link>
          <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                  管理者
                </span>
              )}
              <span className="text-sm text-gray-600">{userName}</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
