import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Ensure roles exist
  const roleNames = ['admin', 'receiver', 'master', 'manager'];
  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name: name as any }, update: {}, create: { name: name as any } });
  }
  console.log('Roles OK');

  // Users to create
  const users = [
    { login: 'admin',     password: 'admin123',    roles: ['admin'] },
    { login: 'receiver1', password: 'receiver123', roles: ['receiver'] },
    { login: 'master1',   password: 'master123',   roles: ['master'] },
    { login: 'manager1',  password: 'manager123',  roles: ['manager'] },
  ];

  for (const u of users) {
    const existing = await prisma.user.findFirst({ where: { login: u.login } });
    if (existing) { console.log(`User ${u.login} already exists`); continue; }

    const hash = await bcrypt.hash(u.password, 10);
    const roleRecords = await prisma.role.findMany({ where: { name: { in: u.roles as any[] } } });

    await prisma.user.create({
      data: {
        login: u.login,
        passwordHash: hash,
        isActive: true,
        roles: { create: roleRecords.map(r => ({ roleId: r.id })) },
      },
    });
    console.log(`Created user: ${u.login} / ${u.password}`);
  }

  console.log('\nDone! Test accounts:');
  users.forEach(u => console.log(`  ${u.login} / ${u.password}`));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
