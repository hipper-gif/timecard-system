import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

console.log('Testing Prisma connection...');
try {
  const users = await prisma.user.findMany({ select: { email: true } });
  console.log('SUCCESS:', JSON.stringify(users));
} catch (err) {
  console.log('FAILED:', err.message);
} finally {
  await prisma.$disconnect();
}
