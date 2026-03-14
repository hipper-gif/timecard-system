import type { BreakRecord } from "@/types";

export type AttendanceAlert = {
  type: "late" | "early_leave" | "overtime";
  minutes: number;
};

/**
 * 出退勤時刻と勤務ルールを比較してアラートを生成する。
 * @param clockIn 出勤時刻
 * @param clockOut 退勤時刻（null = 未退勤）
 * @param rule 勤務ルール（workStartTime: "HH:mm", workEndTime: "HH:mm"）
 * @returns アラートの配列
 */
export function detectAttendanceAlerts(
  clockIn: Date,
  clockOut: Date | null,
  rule: { workStartTime: string; workEndTime: string }
): AttendanceAlert[] {
  const alerts: AttendanceAlert[] = [];

  // clockIn の時:分 を取得
  const cin = new Date(clockIn);
  const cinMinutes = cin.getHours() * 60 + cin.getMinutes();

  // workStartTime を分に変換
  const [startH, startM] = rule.workStartTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;

  // 遅刻判定（5分以上の遅れ）
  const lateMinutes = cinMinutes - startMinutes;
  if (lateMinutes > 5) {
    alerts.push({ type: "late", minutes: lateMinutes });
  }

  if (clockOut) {
    const cout = new Date(clockOut);
    const coutMinutes = cout.getHours() * 60 + cout.getMinutes();

    const [endH, endM] = rule.workEndTime.split(":").map(Number);
    const endMinutes = endH * 60 + endM;

    // 早退判定（5分以上早い）
    const earlyMinutes = endMinutes - coutMinutes;
    if (earlyMinutes > 5) {
      alerts.push({ type: "early_leave", minutes: earlyMinutes });
    }

    // 残業判定（15分以上超過）
    const overtimeMinutes = coutMinutes - endMinutes;
    if (overtimeMinutes > 15) {
      alerts.push({ type: "overtime", minutes: overtimeMinutes });
    }
  }

  return alerts;
}

export function calculateBreakMinutes(breaks: BreakRecord[]): number {
  return breaks.reduce((total, b) => {
    if (!b.breakEnd) return total;
    return total + Math.floor(
      (new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime()) / 60000
    );
  }, 0);
}

export function calculateWorkingMinutes(
  clockIn: Date,
  clockOut: Date | null,
  breaks: BreakRecord[]
): number | null {
  if (!clockOut) return null;
  const totalMinutes = Math.floor(
    (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000
  );
  const breakMinutes = calculateBreakMinutes(breaks);
  return Math.max(0, totalMinutes - breakMinutes);
}

/**
 * 時刻を指定した単位で丸める。
 * @param date 対象の日時
 * @param unitMinutes 丸め単位（分）: 1, 5, 10, 15, 30, 60
 * @param direction 丸め方向: "none"=そのまま, "ceil"=切り上げ, "floor"=切り捨て
 * @returns 丸め後の Date
 */
export function roundTime(
  date: Date | string,
  unitMinutes: number,
  direction: "none" | "ceil" | "floor"
): Date {
  const d = new Date(date);
  if (direction === "none" || unitMinutes <= 1) return d;

  const ms = unitMinutes * 60 * 1000;
  const timestamp = d.getTime();

  if (direction === "floor") {
    return new Date(Math.floor(timestamp / ms) * ms);
  }
  // ceil
  return new Date(Math.ceil(timestamp / ms) * ms);
}

export type RoundingRule = {
  roundingUnit: number;
  clockInRounding: "none" | "ceil" | "floor";
  clockOutRounding: "none" | "ceil" | "floor";
};

/**
 * 丸めルールを適用した勤務時間を計算する。
 * 打刻の生データは変更せず、集計時のみ丸めを適用。
 */
export function calculateWorkingMinutesWithRounding(
  clockIn: Date | string,
  clockOut: Date | string | null,
  breaks: BreakRecord[],
  rounding: RoundingRule
): number | null {
  if (!clockOut) return null;
  const roundedIn = roundTime(clockIn, rounding.roundingUnit, rounding.clockInRounding);
  const roundedOut = roundTime(clockOut, rounding.roundingUnit, rounding.clockOutRounding);
  const totalMinutes = Math.floor(
    (roundedOut.getTime() - roundedIn.getTime()) / 60000
  );
  const breakMinutes = calculateBreakMinutes(breaks);
  return Math.max(0, totalMinutes - breakMinutes);
}

/**
 * 丸めルールを適用した出退勤時刻を返す。表示用。
 */
export function getRoundedTimes(
  clockIn: Date | string,
  clockOut: Date | string | null,
  rounding: RoundingRule
): { roundedClockIn: Date; roundedClockOut: Date | null } {
  return {
    roundedClockIn: roundTime(clockIn, rounding.roundingUnit, rounding.clockInRounding),
    roundedClockOut: clockOut
      ? roundTime(clockOut, rounding.roundingUnit, rounding.clockOutRounding)
      : null,
  };
}
