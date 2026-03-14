"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import type { WorkRuleResolved, BreakTier } from "@/types";

const HARD_CODED_DEFAULT: WorkRuleResolved = {
  workStartTime: "09:00",
  workEndTime: "18:00",
  defaultBreakMinutes: 60,
  breakTiers: [],
  allowMultipleClockIns: false,
  roundingUnit: 1,
  clockInRounding: "none",
  clockOutRounding: "none",
  source: "DEFAULT",
};

export async function getResolvedWorkRule(userId: string): Promise<WorkRuleResolved> {
  try {
    // 1. USER レベル
    const userRule = await prisma.workRule.findFirst({
      where: { scope: "USER", userId },
    });
    if (userRule) {
      return {
        workStartTime: userRule.workStartTime,
        workEndTime: userRule.workEndTime,
        defaultBreakMinutes: userRule.defaultBreakMinutes,
        breakTiers: (userRule.breakTiers as BreakTier[] | null) ?? [],
        allowMultipleClockIns: userRule.allowMultipleClockIns,
        roundingUnit: userRule.roundingUnit,
        clockInRounding: userRule.clockInRounding as "none" | "ceil" | "floor",
        clockOutRounding: userRule.clockOutRounding as "none" | "ceil" | "floor",
        source: "USER",
      };
    }

    // 2. DEPARTMENT レベル
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true },
    });
    if (user?.departmentId) {
      const deptRule = await prisma.workRule.findFirst({
        where: { scope: "DEPARTMENT", departmentId: user.departmentId },
      });
      if (deptRule) {
        return {
          workStartTime: deptRule.workStartTime,
          workEndTime: deptRule.workEndTime,
          defaultBreakMinutes: deptRule.defaultBreakMinutes,
          breakTiers: (deptRule.breakTiers as BreakTier[] | null) ?? [],
          allowMultipleClockIns: deptRule.allowMultipleClockIns,
          roundingUnit: deptRule.roundingUnit,
          clockInRounding: deptRule.clockInRounding as "none" | "ceil" | "floor",
          clockOutRounding: deptRule.clockOutRounding as "none" | "ceil" | "floor",
          source: "DEPARTMENT",
        };
      }
    }

    // 3. SYSTEM レベル
    const systemRule = await prisma.workRule.findFirst({
      where: { scope: "SYSTEM" },
    });
    if (systemRule) {
      return {
        workStartTime: systemRule.workStartTime,
        workEndTime: systemRule.workEndTime,
        defaultBreakMinutes: systemRule.defaultBreakMinutes,
        breakTiers: (systemRule.breakTiers as BreakTier[] | null) ?? [],
        allowMultipleClockIns: systemRule.allowMultipleClockIns,
        roundingUnit: systemRule.roundingUnit,
        clockInRounding: systemRule.clockInRounding as "none" | "ceil" | "floor",
        clockOutRounding: systemRule.clockOutRounding as "none" | "ceil" | "floor",
        source: "SYSTEM",
      };
    }

    // 4. ハードコードデフォルト
    return HARD_CODED_DEFAULT;
  } catch {
    return HARD_CODED_DEFAULT;
  }
}

type UserWithResolvedRule = {
  id: string;
  name: string;
  email: string;
  departmentName: string | null;
  rule: WorkRuleResolved;
};

export async function getAllUsersResolvedRules(): Promise<UserWithResolvedRule[]> {
  await requireAdmin();

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true,
        department: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const results = await Promise.all(
      users.map(async (user) => {
        const rule = await getResolvedWorkRule(user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          departmentName: user.department?.name ?? null,
          rule,
        };
      })
    );

    return results;
  } catch {
    return [];
  }
}

export async function getSystemWorkRule() {
  await requireAdmin();
  try {
    return await prisma.workRule.findFirst({ where: { scope: "SYSTEM" } });
  } catch {
    return null;
  }
}

export async function getDepartmentWorkRules() {
  await requireAdmin();
  try {
    return await prisma.workRule.findMany({
      where: { scope: "DEPARTMENT" },
      include: { department: { select: { id: true, name: true } } },
      orderBy: { department: { name: "asc" } },
    });
  } catch {
    return [];
  }
}

export async function getUserWorkRules() {
  await requireAdmin();
  try {
    return await prisma.workRule.findMany({
      where: { scope: "USER" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    });
  } catch {
    return [];
  }
}

type WorkRuleData = {
  workStartTime: string;
  workEndTime: string;
  defaultBreakMinutes: number;
  breakTiers: { thresholdHours: number; breakMinutes: number }[];
  allowMultipleClockIns: boolean;
  roundingUnit: number;
  clockInRounding: string;
  clockOutRounding: string;
};

function parseWorkRuleFormData(formData: FormData): { error: string } | WorkRuleData {
  const workStartTime = formData.get("workStartTime") as string;
  const workEndTime = formData.get("workEndTime") as string;
  const defaultBreakMinutes = parseInt(formData.get("defaultBreakMinutes") as string);
  const allowMultipleClockIns = formData.get("allowMultipleClockIns") === "on";

  if (!workStartTime || !workEndTime) {
    return { error: "始業時間と終業時間は必須です" };
  }
  if (isNaN(defaultBreakMinutes) || defaultBreakMinutes < 0) {
    return { error: "休憩時間は0以上の数値を入力してください" };
  }

  // Parse breakTiers from form data
  const breakTiersJson = formData.get("breakTiers") as string;
  let breakTiers: { thresholdHours: number; breakMinutes: number }[] = [];
  if (breakTiersJson) {
    try {
      breakTiers = JSON.parse(breakTiersJson);
    } catch {
      return { error: "休憩ルールの形式が正しくありません" };
    }
  }

  const roundingUnit = parseInt(formData.get("roundingUnit") as string) || 1;
  const clockInRounding = (formData.get("clockInRounding") as string) || "none";
  const clockOutRounding = (formData.get("clockOutRounding") as string) || "none";

  const validUnits = [1, 5, 10, 15, 30, 60];
  if (!validUnits.includes(roundingUnit)) {
    return { error: "丸め単位は1, 5, 10, 15, 30, 60分から選択してください" };
  }
  const validDirections = ["none", "ceil", "floor"];
  if (!validDirections.includes(clockInRounding) || !validDirections.includes(clockOutRounding)) {
    return { error: "丸め方向の指定が正しくありません" };
  }

  return { workStartTime, workEndTime, defaultBreakMinutes, breakTiers, allowMultipleClockIns, roundingUnit, clockInRounding, clockOutRounding };
}

export async function upsertSystemWorkRule(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "権限エラー" };
  }

  const parsed = parseWorkRuleFormData(formData);
  if ("error" in parsed) {
    return { success: false, message: parsed.error };
  }

  const existing = await prisma.workRule.findFirst({ where: { scope: "SYSTEM" } });

  if (existing) {
    await prisma.workRule.update({
      where: { id: existing.id },
      data: { ...parsed },
    });
  } else {
    await prisma.workRule.create({
      data: { scope: "SYSTEM", ...parsed },
    });
  }

  revalidatePath("/admin/settings");
  return { success: true, message: "システムルールを保存しました" };
}

export async function upsertDepartmentWorkRule(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "権限エラー" };
  }

  const departmentId = formData.get("departmentId") as string;
  if (!departmentId) {
    return { success: false, message: "部署を選択してください" };
  }

  const parsed = parseWorkRuleFormData(formData);
  if ("error" in parsed) {
    return { success: false, message: parsed.error };
  }

  const existing = await prisma.workRule.findFirst({
    where: { scope: "DEPARTMENT", departmentId },
  });

  if (existing) {
    await prisma.workRule.update({
      where: { id: existing.id },
      data: { ...parsed },
    });
  } else {
    await prisma.workRule.create({
      data: { scope: "DEPARTMENT", department: { connect: { id: departmentId } }, ...parsed },
    });
  }

  revalidatePath("/admin/settings");
  return { success: true, message: "部署ルールを保存しました" };
}

export async function upsertUserWorkRule(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "権限エラー" };
  }

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { success: false, message: "ユーザーを選択してください" };
  }

  const parsed = parseWorkRuleFormData(formData);
  if ("error" in parsed) {
    return { success: false, message: parsed.error };
  }

  const existing = await prisma.workRule.findFirst({
    where: { scope: "USER", userId },
  });

  if (existing) {
    await prisma.workRule.update({
      where: { id: existing.id },
      data: { ...parsed },
    });
  } else {
    await prisma.workRule.create({
      data: { scope: "USER", user: { connect: { id: userId } }, ...parsed },
    });
  }

  revalidatePath("/admin/settings");
  return { success: true, message: "個人ルールを保存しました" };
}

export async function deleteWorkRule(
  _prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "権限エラー" };
  }

  const ruleId = formData.get("ruleId") as string;
  if (!ruleId) {
    return { success: false, message: "ルールIDが指定されていません" };
  }

  const rule = await prisma.workRule.findUnique({ where: { id: ruleId } });
  if (!rule) {
    return { success: false, message: "ルールが見つかりません" };
  }
  if (rule.scope === "SYSTEM") {
    return { success: false, message: "システムルールは削除できません" };
  }

  await prisma.workRule.delete({ where: { id: ruleId } });

  revalidatePath("/admin/settings");
  return { success: true, message: "ルールを削除しました" };
}
