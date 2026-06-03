import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'EvyatarHazan3.14@gmail.com' },
    update: { isAdmin: true },
    create: {
      email: 'EvyatarHazan3.14@gmail.com',
      googleId: 'google-id-admin',
      name: 'Evyatar Hazan',
      isAdmin: true,
    },
  });

  console.log('Created admin user:', adminUser);

  // Create sample comments for demonstration
  const comment1 = await prisma.comment.create({
    data: {
      nodeId: 'asthma_attack',
      content: 'This is an important protocol for asthma attacks',
      authorId: adminUser.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      nodeId: 'report_departure',
      content: 'Always ensure proper reporting before departure',
      authorId: adminUser.id,
    },
  });

  console.log('Created sample comments:', { comment1, comment2 });
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
