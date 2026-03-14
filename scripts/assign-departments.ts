import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

// 社員番号パターン → 部署名のルール
const RULES: { pattern: RegExp; department: string }[] = [
  { pattern: /^nikoniko1/, department: "調理" },
  { pattern: /^nikoniko3/, department: "配達" },
  { pattern: /^can/, department: "美容" },
  { pattern: /^carep/, department: "ケアプランセンター" },
  { pattern: /^care(?!p)/, department: "訪問介護" },
  { pattern: /^eye/, department: "美容" },
];

async function main() {
  // 部署を取得 or 作成
  const deptMap = new Map<string, string>();
  const neededDepts = [...new Set(RULES.map((r) => r.department))];

  for (const name of neededDepts) {
    let dept = await prisma.department.findUnique({ where: { name } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name } });
      console.log(`部署作成: ${name}`);
    }
    deptMap.set(name, dept.id);
  }

  // 全ユーザー取得
  const users = await prisma.user.findMany({
    select: { id: true, employeeNumber: true, name: true, departmentId: true, department: { select: { name: true } } },
  });

  let assigned = 0;
  let skipped = 0;
  let unmatched = 0;
  const unmatchedList: string[] = [];

  for (const user of users) {
    const rule = RULES.find((r) => r.pattern.test(user.employeeNumber));

    if (!rule) {
      unmatched++;
      unmatchedList.push(`  ${user.employeeNumber} | ${user.name}`);
      continue;
    }

    const targetDeptId = deptMap.get(rule.department)!;

    if (user.departmentId === targetDeptId) {
      skipped++;
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { departmentId: targetDeptId },
    });

    const prev = user.department?.name || "未割当";
    console.log(`${user.employeeNumber} | ${user.name}: ${prev} → ${rule.department}`);
    assigned++;
  }

  console.log(`\n完了: ${assigned}名割当, ${skipped}名変更なし, ${unmatched}名未マッチ`);
  if (unmatchedList.length > 0) {
    console.log("未マッチユーザー:");
    unmatchedList.forEach((line) => console.log(line));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
