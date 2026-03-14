"use client";

import { useState, useEffect, useCallback } from "react";
import { lookupUserByKioskCode, kioskClockIn, kioskClockOut } from "@/actions/kiosk";
import Image from "next/image";
import Link from "next/link";

type Screen = "input" | "confirm" | "success" | "error";
type Status = "not_started" | "clocked_in" | "on_break" | "clocked_out";

type UserInfo = {
  id: string;
  name: string;
  status: Status;
  clockInTime: string | null;
};

type Props = {
  departmentId: string;
  departmentName: string;
};

export default function KioskClient({ departmentId, departmentName }: Props) {
  const [screen, setScreen] = useState<Screen>("input");
  const [code, setCode] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 自動リセット（成功/エラー画面で3秒後）
  useEffect(() => {
    if (screen === "success" || screen === "error") {
      const timer = setTimeout(() => {
        setScreen("input");
        setCode("");
        setUser(null);
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // 確認画面で30秒放置したらリセット
  useEffect(() => {
    if (screen === "confirm") {
      const timer = setTimeout(() => {
        setScreen("input");
        setCode("");
        setUser(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleDigit = useCallback((digit: string) => {
    setCode((prev) => {
      if (prev.length >= 4) return prev;
      return prev + digit;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setCode((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setCode("");
  }, []);

  // 4桁入力で自動検索
  useEffect(() => {
    if (code.length === 4 && screen === "input") {
      setLoading(true);
      lookupUserByKioskCode(departmentId, code).then((result) => {
        setLoading(false);
        if (result.success && result.user) {
          setUser(result.user);
          setScreen("confirm");
        } else {
          setMessage(result.message);
          setScreen("error");
        }
      });
    }
  }, [code, departmentId, screen]);

  const handleClock = async () => {
    if (!user) return;
    setLoading(true);

    const result =
      user.status === "not_started"
        ? await kioskClockIn(user.id, departmentId)
        : await kioskClockOut(user.id, departmentId);

    setLoading(false);
    if (result.success) {
      setMessage(result.message);
      setScreen("success");
    } else {
      setMessage(result.message);
      setScreen("error");
    }
  };

  const handleCancel = () => {
    setScreen("input");
    setCode("");
    setUser(null);
  };

  const timeStr = currentTime.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = currentTime.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const statusLabel: Record<Status, string> = {
    not_started: "未出勤",
    clocked_in: "勤務中",
    on_break: "休憩中",
    clocked_out: "退勤済み",
  };

  const statusColor: Record<Status, string> = {
    not_started: "text-gray-500",
    clocked_in: "text-green-600",
    on_break: "text-orange-600",
    clocked_out: "text-blue-600",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 select-none">
      {/* ヘッダー: ロゴ・時刻・部署名 */}
      <div className="flex flex-col items-center mb-6">
        <Image src="/logo.png" alt="SmartClock" width={180} height={52} className="mb-3" />
        <p className="text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
          {timeStr}
        </p>
        <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
        <p className="text-base font-medium text-blue-600 mt-2">{departmentName}</p>
      </div>

      {/* 入力画面 */}
      {screen === "input" && (
        <div className="w-full max-w-xs">
          {/* コード表示 */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  code[i]
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-300"
                }`}
              >
                {code[i] || ""}
              </div>
            ))}
          </div>

          {/* テンキー */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                disabled={loading || code.length >= 4}
                className="py-4 text-2xl font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={loading}
              className="py-4 text-sm font-medium bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-600"
            >
              クリア
            </button>
            <button
              onClick={() => handleDigit("0")}
              disabled={loading || code.length >= 4}
              className="py-4 text-2xl font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={loading || code.length === 0}
              className="py-4 text-xl bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-colors text-gray-600"
            >
              ←
            </button>
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-400 mt-4">検索中...</p>
          )}

          <Link
            href="/kiosk"
            className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-8 transition-colors"
          >
            ← 部署選択に戻る
          </Link>
        </div>
      )}

      {/* 確認画面 */}
      {screen === "confirm" && user && (
        <div className="w-full max-w-xs text-center">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
            <p className="text-2xl font-bold text-gray-900 mb-2">{user.name}</p>
            <p className={`text-lg font-semibold ${statusColor[user.status]}`}>
              {statusLabel[user.status]}
            </p>
            {user.clockInTime && (
              <p className="text-sm text-gray-500 mt-1">
                出勤{" "}
                {new Date(user.clockInTime).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {user.status === "not_started" && (
            <button
              onClick={handleClock}
              disabled={loading}
              className="w-full py-5 text-xl bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg"
            >
              {loading ? "処理中..." : "出勤"}
            </button>
          )}

          {(user.status === "clocked_in" || user.status === "on_break") && (
            <button
              onClick={handleClock}
              disabled={loading}
              className="w-full py-5 text-xl bg-gray-700 text-white font-bold rounded-2xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg"
            >
              {loading ? "処理中..." : "退勤"}
            </button>
          )}

          {user.status === "clocked_out" && (
            <div className="py-4">
              <p className="text-gray-500">本日の打刻は完了しています</p>
            </div>
          )}

          <button
            onClick={handleCancel}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* 成功画面 */}
      {screen === "success" && (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900">打刻完了</p>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
          <p className="text-xs text-gray-400 mt-4">3秒後に入力画面に戻ります</p>
        </div>
      )}

      {/* エラー画面 */}
      {screen === "error" && (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900">エラー</p>
          <p className="text-sm text-red-600 mt-2">{message}</p>
          <p className="text-xs text-gray-400 mt-4">3秒後に入力画面に戻ります</p>
        </div>
      )}
    </div>
  );
}
