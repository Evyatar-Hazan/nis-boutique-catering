import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing worker permissions...');

  // Get all workers
  const workers = await prisma.user.findMany({
    where: { role: 'WORKER' },
  });

  if (workers.length === 0) {
    console.log('ℹ️  No workers found');
    return;
  }

  console.log(`📋 Found ${workers.length} worker(s)`);

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();
  console.log(`📋 Found ${allPermissions.length} permissions`);

  // Define worker permissions with new format
  const workerPermissionNames = [
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

  const workerPermissions = allPermissions.filter((p) =>
    workerPermissionNames.includes(p.name)
  );

  console.log(`🔑 Worker should have ${workerPermissions.length} permissions:`);
  console.log(workerPermissions.map((p) => p.name).join(', '));

  // For each worker, assign all worker permissions
  for (const worker of workers) {
    console.log(`\n👷 Updating permissions for: ${worker.email}`);

    // Remove all old permissions first
    await prisma.userPermission.deleteMany({
      where: { userId: worker.id },
    });
    console.log('  ❌ Removed old permissions');

    // Add new permissions
    for (const permission of workerPermissions) {
      await prisma.userPermission.create({
        data: {
          userId: worker.id,
          permissionId: permission.id,
          grantedBy: worker.id,
        },
      });
    }
    console.log(`  ✅ Added ${workerPermissions.length} new permissions`);
  }

  console.log('\n✅ Worker permissions fixed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Failed to fix worker permissions:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
