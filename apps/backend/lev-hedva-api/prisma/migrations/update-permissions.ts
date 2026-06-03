import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting permissions migration...');

  // Map old permission names to new ones
  const permissionMappings = [
    // User permissions
    { old: 'users.read', new: 'user:read' },
    { old: 'users.write', new: 'user:create' },
    { old: 'users.delete', new: 'user:delete' },

    // Product permissions
    { old: 'products.read', new: 'product:read' },
    { old: 'products.write', new: 'product:create' },
    { old: 'products.delete', new: 'product:delete' },

    // Loan permissions
    { old: 'loans.read', new: 'loan:read' },
    { old: 'loans.write', new: 'loan:create' },
    { old: 'loans.delete', new: 'loan:delete' },

    // Admin permissions
    { old: 'permissions.manage', new: 'admin:users' },
    { old: 'audit.read', new: 'admin:audit' },
  ];

  // Update existing permissions
  for (const mapping of permissionMappings) {
    const existingPermission = await prisma.permission.findUnique({
      where: { name: mapping.old },
    });

    if (existingPermission) {
      await prisma.permission.update({
        where: { name: mapping.old },
        data: { name: mapping.new },
      });
      console.log(`✓ Updated: ${mapping.old} → ${mapping.new}`);
    }
  }

  // Add new missing permissions
  const newPermissions = [
    { name: 'user:update', description: 'Update users' },
    { name: 'product:update', description: 'Update products' },
    { name: 'product:manage', description: 'Manage products' },
    { name: 'loan:update', description: 'Update loans' },
    { name: 'loan:return', description: 'Return loans' },
    { name: 'loan:overdue', description: 'Manage overdue loans' },
    { name: 'admin:full', description: 'Full admin access' },
    { name: 'admin:system', description: 'System administration' },
  ];

  for (const permission of newPermissions) {
    const exists = await prisma.permission.findUnique({
      where: { name: permission.name },
    });

    if (!exists) {
      await prisma.permission.create({
        data: permission,
      });
      console.log(`✓ Created: ${permission.name}`);
    }
  }

  // Update worker permissions
  console.log('\n🔧 Updating worker permissions...');
  const workers = await prisma.user.findMany({
    where: { role: 'WORKER' },
    include: { userPermissions: { include: { permission: true } } },
  });

  for (const worker of workers) {
    const workerPermissions = [
      'user:read',
      'product:read',
      'product:create',
      'product:update',
      'product:delete',
      'product:manage',
      'loan:read',
      'loan:create',
      'loan:update',
      'loan:delete',
      'loan:return',
      'loan:overdue',
      'volunteer:read',
      'volunteer:create',
      'volunteer:update',
      'volunteer:delete',
      'volunteer:stats',
      'volunteer:reports',
    ];

    for (const permName of workerPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });

      if (permission) {
        const hasPermission = worker.userPermissions.some(
          (up) => up.permissionId === permission.id
        );

        if (!hasPermission) {
          await prisma.userPermission.create({
            data: {
              userId: worker.id,
              permissionId: permission.id,
              grantedBy: worker.id,
            },
          });
          console.log(`✓ Added ${permName} to worker ${worker.email}`);
        }
      }
    }
  }

  // Update admin permissions
  console.log('\n👑 Updating admin permissions...');
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  });

  for (const admin of admins) {
    const allPermissions = await prisma.permission.findMany();

    for (const permission of allPermissions) {
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
          grantedBy: admin.id,
        },
      });
    }
    console.log(`✓ Updated all permissions for admin ${admin.email}`);
  }

  console.log('\n✅ Permissions migration completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
