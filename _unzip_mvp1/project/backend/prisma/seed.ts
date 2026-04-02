import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles: RoleName[] = ['admin', 'receiver', 'master', 'manager'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Roles seeded');

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const receiverRole = await prisma.role.findUnique({ where: { name: 'receiver' } });
  const masterRole = await prisma.role.findUnique({ where: { name: 'master' } });

  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      passwordHash: adminHash,
      isActive: true,
      roles: { create: [{ roleId: adminRole!.id }] },
    },
  });

  const receiverHash = await bcrypt.hash('receiver123', 10);
  await prisma.user.upsert({
    where: { login: 'receiver1' },
    update: {},
    create: {
      login: 'receiver1',
      passwordHash: receiverHash,
      isActive: true,
      roles: { create: [{ roleId: receiverRole!.id }] },
    },
  });

  const masterHash = await bcrypt.hash('master123', 10);
  await prisma.user.upsert({
    where: { login: 'master1' },
    update: {},
    create: {
      login: 'master1',
      passwordHash: masterHash,
      isActive: true,
      roles: { create: [{ roleId: masterRole!.id }] },
    },
  });

  console.log('✅ Users seeded');
  console.log('  admin / admin123');
  console.log('  receiver1 / receiver123');
  console.log('  master1 / master123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
