export type Role = "ADMIN" | "EMPLOYEE";

export type AttendanceStatus = "clocked_in" | "clocked_out" | "not_started" | "on_break";

export interface BreakRecord {
  id: string;
  attendanceId: string;
  breakStart: Date;
  breakEnd: Date | null;
  latitude: number | null;
  longitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  clockIn: Date;
  clockOut: Date | null;
  note: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  breaks: BreakRecord[];
  createdAt: Date;
}

export interface TodayAttendance {
  status: AttendanceStatus;
  attendance: AttendanceRecord | null;
  workingMinutes: number | null;
  breakMinutes: number | null;
  breakCount: number;
}

export interface BreakTier {
  thresholdHours: number;
  breakMinutes: number;
}

export interface WorkRuleResolved {
  workStartTime: string;
  workEndTime: string;
  defaultBreakMinutes: number;
  breakTiers: BreakTier[];
  allowMultipleClockIns: boolean;
  roundingUnit: number;
  clockInRounding: "none" | "ceil" | "floor";
  clockOutRounding: "none" | "ceil" | "floor";
  source: "SYSTEM" | "DEPARTMENT" | "USER" | "DEFAULT";
}
