import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  console.log('🔄 Resetting admin password...');

  // Hash the new password
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  // Update admin user
  const adminUser = await prisma.user.update({
    where: { email: 'admin@levhedva.org' },
    data: {
      password: hashedPassword,
    },
  });

  console.log('✅ Admin password reset successfully');
  console.log('📧 Email: admin@levhedva.org');
  console.log('🔑 Password: Admin123!');
}

resetAdminPassword()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });