import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create basic permissions
  const permissions = [
    // User permissions
    { name: 'users.read', description: 'Read users' },
    { name: 'users.write', description: 'Create and update users' },
    { name: 'users.delete', description: 'Delete users' },

    // Product permissions
    { name: 'products.read', description: 'Read products' },
    { name: 'products.write', description: 'Create and update products' },
    { name: 'products.delete', description: 'Delete products' },

    // Loan permissions
    { name: 'loans.read', description: 'Read loans' },
    { name: 'loans.write', description: 'Create and update loans' },
    { name: 'loans.delete', description: 'Delete loans' },

    // Volunteer permissions (using new format from permissions.constants.ts)
    { name: 'volunteer:read', description: 'Read volunteer activities' },
    { name: 'volunteer:create', description: 'Create volunteer activities' },
    { name: 'volunteer:update', description: 'Update volunteer activities' },
    { name: 'volunteer:delete', description: 'Delete volunteer activities' },
    { name: 'volunteer:stats', description: 'View volunteer statistics' },
    { name: 'volunteer:reports', description: 'Generate volunteer reports' },

    // Admin permissions
    { name: 'permissions.manage', description: 'Manage user permissions' },
    { name: 'audit.read', description: 'Read audit logs' },
  ];

  console.log('📋 Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@levhedva.org' },
    update: {},
    create: {
      email: 'admin@levhedva.org',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+972-50-1234567',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Give admin all permissions
  console.log('🔑 Assigning permissions to admin...');
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: adminUser.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        permissionId: permission.id,
      },
    });
  }

  // Create sample worker
  console.log('👷 Creating sample worker...');
  const workerPassword = await bcrypt.hash('Worker123!', 12);

  const worker = await prisma.user.upsert({
    where: { email: 'worker@levhedva.org' },
    update: {},
    create: {
      email: 'worker@levhedva.org',
      password: workerPassword,
      firstName: 'David',
      lastName: 'Cohen',
      phone: '+972-50-2345678',
      role: UserRole.WORKER,
      isActive: true,
    },
  });

  // Give worker permissions - can access everything except user management and audit
  const workerPermissions = [
    'users.read',
    'products.read',
    'products.write',
    'products.delete',
    'loans.read',
    'loans.write',
    'loans.delete',
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
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: worker.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: worker.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Create sample volunteer
  console.log('🤝 Creating sample volunteer...');
  const volunteerPassword = await bcrypt.hash('Volunteer123!', 12);

  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@levhedva.org' },
    update: {},
    create: {
      email: 'volunteer@levhedva.org',
      password: volunteerPassword,
      firstName: 'Sarah',
      lastName: 'Levy',
      phone: '+972-50-3456789',
      role: UserRole.VOLUNTEER,
      isActive: true,
    },
  });

  // Give volunteer basic permissions - volunteers can only view their own activities and register for new ones
  const volunteerPermissions = ['volunteer:read', 'volunteer:create'];
  for (const permName of volunteerPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permName },
    });
    if (permission) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: volunteer.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: volunteer.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Create sample client
  console.log('👤 Creating sample client...');
  const clientPassword = await bcrypt.hash('Client123!', 12);

  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      firstName: 'Rachel',
      lastName: 'Israeli',
      phone: '+972-50-4567890',
      role: UserRole.CLIENT,
      isActive: true,
    },
  });

  // Give client loan:read permission
  const clientPermissions = ['loans.read'];
  for (const permName of clientPermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: permName },
    });
    if (permission) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: client.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: client.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Create sample products
  console.log('📦 Creating sample products...');

  const wheelchairProduct = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'כסא גלגלים סטנדרטי',
      description: 'כסא גלגלים סטנדרטי עם גלגלים קבועים',
      category: 'כסאות גלגלים',
      manufacturer: 'Karma Medical',
      model: 'KM-2500',
    },
  });

  const walkerProduct = await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'הליכון עם גלגלים',
      description: 'הליכון ארבע גלגלים עם בלמים',
      category: 'עזרי הליכה',
      manufacturer: 'Drive Medical',
      model: 'DM-Walker-Pro',
    },
  });

  const bedProduct = await prisma.product.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'מיטה רפואית',
      description: 'מיטה רפואית חשמלית עם הגבהה',
      category: 'מיטות רפואיות',
      manufacturer: 'Hill-Rom',
      model: 'HR-3000',
    },
  });

  // Create sample product instances
  console.log('🏷️ Creating sample product instances...');

  // Wheelchair instances
  for (let i = 1; i <= 3; i++) {
    await prisma.productInstance.upsert({
      where: { barcode: `WC${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        productId: wheelchairProduct.id,
        barcode: `WC${String(i).padStart(3, '0')}`,
        serialNumber: `WC-2024-${String(i).padStart(3, '0')}`,
        condition: i === 1 ? 'excellent' : i === 2 ? 'good' : 'fair',
        location: 'מחסן ראשי',
        notes: i === 3 ? 'זקוק לבדיקה שנתית' : null,
      },
    });
  }

  // Walker instances
  for (let i = 1; i <= 5; i++) {
    await prisma.productInstance.upsert({
      where: { barcode: `WK${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        productId: walkerProduct.id,
        barcode: `WK${String(i).padStart(3, '0')}`,
        serialNumber: `WK-2024-${String(i).padStart(3, '0')}`,
        condition: 'good',
        location: 'מחסן ראשי',
      },
    });
  }

  // Bed instances
  for (let i = 1; i <= 2; i++) {
    await prisma.productInstance.upsert({
      where: { barcode: `BD${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        productId: bedProduct.id,
        barcode: `BD${String(i).padStart(3, '0')}`,
        serialNumber: `BD-2024-${String(i).padStart(3, '0')}`,
        condition: 'excellent',
        location: 'מחסן ראשי',
      },
    });
  }

  // Create sample volunteer activities
  console.log('📊 Creating sample volunteer activities...');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.volunteerActivity.create({
    data: {
      volunteerId: volunteer.id,
      activityType: 'ניקוי וחיטוי',
      description: 'ניקוי וחיטוי כסאות גלגלים',
      hours: 3.5,
      date: oneWeekAgo,
    },
  });

  await prisma.volunteerActivity.create({
    data: {
      volunteerId: volunteer.id,
      activityType: 'מחסן',
      description: 'ארגון המחסן ועדכון רשימת הציוד',
      hours: 2.0,
      date: yesterday,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📋 Created:');
  console.log('   - 15 permissions');
  console.log('   - 4 users (admin, worker, volunteer, client)');
  console.log('   - 3 product categories');
  console.log('   - 10 product instances');
  console.log('   - 2 volunteer activities');
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   Admin: admin@levhedva.org / Admin123!@#');
  console.log('   Worker: worker@levhedva.org / Worker123!');
  console.log('   Volunteer: volunteer@levhedva.org / Volunteer123!');
  console.log('   Client: client@example.com / Client123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
