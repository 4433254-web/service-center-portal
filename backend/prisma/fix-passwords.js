"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function run() {
    const users = [
        { login: 'admin', password: 'admin123' },
        { login: 'receiver1', password: 'receiver123' },
        { login: 'master1', password: 'master123' },
        { login: 'manager1', password: 'manager123' },
    ];
    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10);
        const updated = await prisma.user.update({ where: { login: u.login }, data: { passwordHash: hash } });
        console.log(`Reset: ${u.login} / ${u.password} (id: ${updated.id})`);
    }
    await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=fix-passwords.js.map