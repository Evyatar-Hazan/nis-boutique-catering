import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user with full permissions...');

    // Create permissions first
    const permissionsList = [
      { name: 'users.read', description: 'Read users' },
      { name: 'users.write', description: 'Create and update users' },
      { name: 'users.delete', description: 'Delete users' },
      { name: 'products.read', description: 'Read products' },
      { name: 'products.write', description: 'Create and update products' },
      { name: 'products.delete', description: 'Delete products' },
      { name: 'loans.read', description: 'Read loans' },
      { name: 'loans.write', description: 'Create and update loans' },
      { name: 'loans.delete', description: 'Delete loans' },
      { name: 'volunteers.read', description: 'Read volunteer activities' },
      {
        name: 'volunteers.write',
        description: 'Create and update volunteer activities',
      },
      { name: 'volunteers.delete', description: 'Delete volunteer activities' },
      { name: 'audit.read', description: 'Read audit logs' },
      { name: 'permissions.manage', description: 'Manage user permissions' },
      { name: 'system.admin', description: 'Full system administration' },
    ];

    console.log('📋 Creating permissions...');
    const createdPermissions = [];
    for (const permission of permissionsList) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      createdPermissions.push(created);
    }
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@levhedva.org' },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: 'admin@levhedva.org',
        password: hashedPassword,
        firstName: 'מנהל',
        lastName: 'מערכת',
        phone: '+972-50-1234567',
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    console.log('✅ Admin user created/updated:', admin.email);

    // Assign all permissions to admin
    console.log('🔑 Assigning permissions to admin...');
    for (const permission of createdPermissions) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: admin.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: admin.id,
          permissionId: permission.id,
        },
      });
    }

    console.log('✅ All permissions assigned to admin');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role:', admin.role);
    console.log('🎯 Permissions:', createdPermissions.length);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
