import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
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

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 部署の作成
  const honbu = await prisma.department.upsert({
    where: { name: "本部" },
    update: {},
    create: { name: "本部" },
  });

  const smiley = await prisma.department.upsert({
    where: { name: "Smiley" },
    update: {},
    create: { name: "Smiley" },
  });

  const deptMap: Record<string, string> = {
    "本部": honbu.id,
    "Smiley": smiley.id,
  };

  // MAIDO SYSTEMから移行したスタッフデータ（157名）
  const staff = [
    { employeeNumber: "nikoniko000", name: "杉原真希", dept: "本部", role: "ADMIN" as const, isActive: true },
    { employeeNumber: "nikoniko", name: "杉原充", dept: "本部", role: "ADMIN" as const, isActive: true },
    { employeeNumber: "nikoniko101", name: "工藤洋子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko107", name: "林三枝", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko116", name: "鹿島加奈子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko213", name: "永井智恵子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko214", name: "保田翔", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko230", name: "本城智紗都", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko236", name: "藤本亜紀", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko263", name: "康翊祐", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko273", name: "積大介", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko134", name: "藤島美和", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko142", name: "中村恵", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko144", name: "天野真由美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko323", name: "髙橋純也", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko324", name: "木村渉", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko151", name: "中川結", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko150", name: "黒田由香里", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko326", name: "徳田けい", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko327", name: "椎野祐希", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko328", name: "吉田理久", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko329", name: "西岡晃大", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko152", name: "三根楓子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko153", name: "福岡伯我", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko330", name: "能勢知子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko331", name: "筒井孝幸", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko332", name: "北野千代", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko333", name: "前川優人", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko154", name: "坂本まどか", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko155", name: "箱田歩美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko334", name: "朝倉一博", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko335", name: "山下学", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko156", name: "林淳子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko157", name: "岩本ゆみ", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko158", name: "竹本卓昭", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko336", name: "中島葉月", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko337", name: "山岸秀俊", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko338", name: "筒井美賀子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko339", name: "花見一也", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko159", name: "小畑由美子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko340", name: "前原祐樹", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko341", name: "藤原恵美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko160", name: "外薗真理", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko342", name: "中島晴空", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko343", name: "細谷義男", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko344", name: "小松あかり", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko345", name: "橋内裕司", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko346", name: "奥千代丸", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko347", name: "守屋健太郎", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko348", name: "金田健士郎", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko349", name: "橋口三紀", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko350", name: "牧吉元気", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko351", name: "清水拓翔", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko161", name: "越打宣行", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko352", name: "中奈津美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko353", name: "白石智也", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko354", name: "松田莉壱", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko355", name: "寺原瞳", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko356", name: "金城怜央", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko162", name: "髙橋由美子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko357", name: "柚木﨑真一", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko358", name: "笠井千花", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko163", name: "野田理沙", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko359", name: "竹中良世", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can001", name: "酒樂民", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can002", name: "井山美紀", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can003", name: "上石田琴愛", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko360", name: "赤崎正貴", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko361", name: "福原太一", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko164", name: "福原由利子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko362", name: "平野里奈", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko165", name: "塩路明子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko363", name: "大東睦", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko364", name: "河野理夢叶", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can004", name: "津村愛歩", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko365", name: "塚田秀太", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko366", name: "加世堂兼伍", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "care002", name: "堤智子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "care001", name: "守屋陽子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko367", name: "眞壁亜友美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko166", name: "佐村木勇斗", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko368", name: "山下美紀", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can005", name: "多賀采里", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko167", name: "目黒美月", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko168", name: "稲田優子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko169", name: "榎本里美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko369", name: "吉川一人", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko170", name: "前田真幸", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko171", name: "上原梨沙", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko370", name: "田村綾", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko371", name: "細田悠愛", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can006", name: "和田麻歩", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can007", name: "大石怜奈", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can008", name: "福谷未来", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko372", name: "横山聖治", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "care004", name: "中谷真理子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can009", name: "今道寿子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can010", name: "上村恵美子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko003", name: "杉原星", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko172", name: "佐藤咲子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko173", name: "濱口知子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko373", name: "大水椋翔", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko374", name: "西村賢司", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko375", name: "堀雅斗", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "carep002", name: "西野裕美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "care007", name: "真弓頼子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko174", name: "大東美奈", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can011", name: "橋本愛梨", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can012", name: "清水楓佳", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can013", name: "森下優奈", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "eye001", name: "太田裕美", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "eye002", name: "山下日楠", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "care008", name: "浅澤玲子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko377", name: "田中玲光", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "carep001", name: "松本邦康", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "carep003", name: "島原崇", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko378", name: "山本正彦", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko379", name: "山野誠太", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko380", name: "東義博", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko176", name: "池元三奈", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko381", name: "渡邊真希", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko382", name: "鮒谷楓人", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko383", name: "寺内愛果", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can014", name: "加藤春菜", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko384", name: "矢野裕之", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can015", name: "藤田夏帆", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can016", name: "林美咲", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko385", name: "佐々木紀子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "care009", name: "福井美智代", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko386", name: "中條治", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko177", name: "楠本光子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "carep004", name: "後藤慎二", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko387", name: "平田貴信", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko388", name: "高山巌鳳", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko389", name: "平林靖弘", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can000", name: "田邊心", dept: "本部", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can017", name: "田邊心", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko390", name: "玉木秀一", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko391", name: "前田扇妃", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "care005", name: "杉原爽夏", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "taxi01", name: "杉原星", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can018", name: "増井寧々", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko392", name: "千葉りゅうき", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "nikoniko393", name: "大﨑葵", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko394", name: "山澤薪司", dept: "Smiley", role: "EMPLOYEE" as const, isActive: false },
    { employeeNumber: "can019", name: "伊藤梨音", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko395", name: "坂本康平", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "carep005", name: "六谷菜浦子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko396", name: "小川樹里", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can020", name: "寺西茉莉亜", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can021", name: "久下愛音", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "taxi02", name: "青嶋昭憲", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can022", name: "浅野梨々花", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can023", name: "北風朱理", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "can024", name: "日妻詩葉", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko175", name: "岩永暁子", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
    { employeeNumber: "nikoniko397", name: "鈴木泉", dept: "Smiley", role: "EMPLOYEE" as const, isActive: true },
  ];

  let activeCount = 0;
  let inactiveCount = 0;

  for (const s of staff) {
    const departmentId = deptMap[s.dept];
    await prisma.user.upsert({
      where: { employeeNumber: s.employeeNumber },
      update: {
        name: s.name,
        role: s.role,
        isActive: s.isActive,
        departmentId,
      },
      create: {
        employeeNumber: s.employeeNumber,
        name: s.name,
        email: `${s.employeeNumber}@smartclock.local`,
        password: hashedPassword,
        role: s.role,
        isActive: s.isActive,
        departmentId,
      },
    });
    if (s.isActive) activeCount++;
    else inactiveCount++;
    console.log(`${s.isActive ? "✓" : "✗"} ${s.employeeNumber} - ${s.name} (${s.role}, ${s.dept})`);
  }

  // システムデフォルトの勤務ルール
  const existingSystemRule = await prisma.workRule.findFirst({
    where: { scope: "SYSTEM" },
  });
  if (!existingSystemRule) {
    await prisma.workRule.create({
      data: {
        scope: "SYSTEM",
        workStartTime: "09:00",
        workEndTime: "18:00",
        defaultBreakMinutes: 60,
        allowMultipleClockIns: false,
      },
    });
  }

  console.log(`\nシードデータの投入が完了しました`);
  console.log(`有効: ${activeCount}名, 無効: ${inactiveCount}名, 合計: ${staff.length}名`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
