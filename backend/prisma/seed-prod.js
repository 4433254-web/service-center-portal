const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const roles = ['admin','receiver','master','manager'];
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('Roles OK');

  const users = [
    { login: 'admin',     password: 'admin123',    roles: ['admin'] },
    { login: 'receiver1', password: 'receiver123', roles: ['receiver'] },
    { login: 'master1',   password: 'master123',   roles: ['master'] },
    { login: 'manager1',  password: 'manager123',  roles: ['manager'] },
  ];

  for (const u of users) {
    const ex = await prisma.user.findFirst({ where: { login: u.login } });
    if (ex) { console.log('exists:', u.login); continue; }
    const hash = await bcrypt.hash(u.password, 10);
    const roleRecs = await prisma.role.findMany({ where: { name: { in: u.roles } } });
    await prisma.user.create({
      data: {
        login: u.login, passwordHash: hash, isActive: true,
        roles: { create: roleRecs.map(r => ({ roleId: r.id })) }
      }
    });
    console.log('created:', u.login, '/', u.password);
  }
  await prisma.$disconnect();
  console.log('DONE');
}

run().catch(e => { console.error(e); process.exit(1); });
