"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const roles = ['admin', 'receiver', 'master', 'manager'];
    for (const name of roles) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: {
                name,
            },
        });
    }
    console.log('Roles seeded');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map