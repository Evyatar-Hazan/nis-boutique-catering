import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create basic permissions
  const permissions = [
    // User permissions
    { name: 'user:read', description: 'Read users' },
    { name: 'user:create', description: 'Create users' },
    { name: 'user:update', description: 'Update users' },
    { name: 'user:delete', description: 'Delete users' },

    // Product permissions
    { name: 'product:read', description: 'Read products' },
    { name: 'product:create', description: 'Create products' },
    { name: 'product:update', description: 'Update products' },
    { name: 'product:delete', description: 'Delete products' },
    { name: 'product:manage', description: 'Manage products' },

    // Loan permissions
    { name: 'loan:read', description: 'Read loans' },
    { name: 'loan:create', description: 'Create loans' },
    { name: 'loan:update', description: 'Update loans' },
    { name: 'loan:delete', description: 'Delete loans' },
    { name: 'loan:return', description: 'Return loans' },
    { name: 'loan:overdue', description: 'Manage overdue loans' },

    // Volunteer permissions (using new format from permissions.constants.ts)
    { name: 'volunteer:read', description: 'Read volunteer activities' },
    { name: 'volunteer:create', description: 'Create volunteer activities' },
    { name: 'volunteer:update', description: 'Update volunteer activities' },
    { name: 'volunteer:delete', description: 'Delete volunteer activities' },
    { name: 'volunteer:stats', description: 'View volunteer statistics' },
    { name: 'volunteer:reports', description: 'Generate volunteer reports' },

    // Admin permissions
    { name: 'admin:full', description: 'Full admin access' },
    { name: 'admin:users', description: 'Manage users' },
    { name: 'admin:system', description: 'System administration' },
    { name: 'admin:audit', description: 'Audit logs access' },
  ];

  console.log('📋 Creating permissions...');
  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    createdPermissions.push(created);
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@levhedva.org' },
    update: {},
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

  // Assign all permissions to admin
  for (const permission of createdPermissions) {
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
        grantedBy: adminUser.id,
      },
    });
  }

  // Create worker user
  console.log('👷 Creating worker user...');
  const workerPassword = await bcrypt.hash('Worker123!', 12);

  const workerUser = await prisma.user.upsert({
    where: { email: 'worker@levhedva.org' },
    update: {},
    create: {
      email: 'worker@levhedva.org',
      password: workerPassword,
      firstName: 'עובד',
      lastName: 'מוקד',
      phone: '+972-50-2345678',
      role: UserRole.WORKER,
      isActive: true,
    },
  });

  // Assign worker permissions - can access everything except user management and audit
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
    const permission = createdPermissions.find((p) => p.name === permName);
    if (permission) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: workerUser.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: workerUser.id,
          permissionId: permission.id,
          grantedBy: adminUser.id,
        },
      });
    }
  }

  // Create volunteer user
  console.log('🙋 Creating volunteer user...');
  const volunteerPassword = await bcrypt.hash('Volunteer123!', 12);

  const volunteerUser = await prisma.user.upsert({
    where: { email: 'volunteer@levhedva.org' },
    update: {},
    create: {
      email: 'volunteer@levhedva.org',
      password: volunteerPassword,
      firstName: 'מתנדב',
      lastName: 'פעיל',
      phone: '+972-50-3456789',
      role: UserRole.VOLUNTEER,
      isActive: true,
    },
  });

  // Assign volunteer permissions - volunteers can only view their own activities and register for new ones
  const volunteerPermissions = ['volunteer:read', 'volunteer:create'];
  for (const permName of volunteerPermissions) {
    const permission = createdPermissions.find((p) => p.name === permName);
    if (permission) {
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: volunteerUser.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          userId: volunteerUser.id,
          permissionId: permission.id,
          grantedBy: adminUser.id,
        },
      });
    }
  }

  // Create client user
  console.log('הוספת לקוח...');
  const clientPassword = await bcrypt.hash('Client123!', 12);

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      firstName: 'לקוח',
      lastName: 'דוגמה',
      phone: '+972-50-4567890',
      role: UserRole.CLIENT,
      isActive: true,
    },
  });

  // Give client loan:read permission
  const loanReadPermission = createdPermissions.find(
    (p) => p.name === 'loan:read'
  );
  if (loanReadPermission) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: clientUser.id,
          permissionId: loanReadPermission.id,
        },
      },
      update: {},
      create: {
        userId: clientUser.id,
        permissionId: loanReadPermission.id,
        grantedBy: adminUser.id,
      },
    });
  }

  // Create sample products
  console.log('📦 Creating sample products...');

  const wheelchairProduct = await prisma.product.create({
    data: {
      name: 'כסא גלגלים סטנדרטי',
      description: 'כסא גלגלים סטנדרטי עם גלגלים קבועים',
      category: 'כסאות גלגלים',
      manufacturer: 'Karma Medical',
      model: 'KM-2500',
    },
  });

  const walkerProduct = await prisma.product.create({
    data: {
      name: 'הליכון עם גלגלים',
      description: 'הליכון ארבע גלגלים עם בלמים',
      category: 'עזרי הליכה',
      manufacturer: 'Drive Medical',
      model: 'DM-Walker-Pro',
    },
  });

  const bedProduct = await prisma.product.create({
    data: {
      name: 'מיטה רפואית',
      description: 'מיטה רפואית חשמלית עם מזרון',
      category: 'מיטות רפואיות',
      manufacturer: 'Hill-Rom',
      model: 'HR-1000',
    },
  });

  // Create product instances
  console.log('📋 Creating product instances...');

  const productInstances = [
    // Wheelchair instances
    {
      productId: wheelchairProduct.id,
      barcode: 'WC001',
      serialNumber: 'KM2500-001',
      location: 'מחסן א׳',
      condition: 'excellent',
    },
    {
      productId: wheelchairProduct.id,
      barcode: 'WC002',
      serialNumber: 'KM2500-002',
      location: 'מחסן א׳',
      condition: 'good',
    },
    {
      productId: wheelchairProduct.id,
      barcode: 'WC003',
      serialNumber: 'KM2500-003',
      location: 'מוקד שירות',
      condition: 'fair',
    },

    // Walker instances
    {
      productId: walkerProduct.id,
      barcode: 'WK001',
      serialNumber: 'DM-PRO-001',
      location: 'מחסן ב׳',
      condition: 'excellent',
    },
    {
      productId: walkerProduct.id,
      barcode: 'WK002',
      serialNumber: 'DM-PRO-002',
      location: 'מחסן ב׳',
      condition: 'good',
    },
    {
      productId: walkerProduct.id,
      barcode: 'WK003',
      serialNumber: 'DM-PRO-003',
      location: 'מוקד שירות',
      condition: 'good',
    },

    // Bed instances
    {
      productId: bedProduct.id,
      barcode: 'BD001',
      serialNumber: 'HR1000-001',
      location: 'מחסן ג׳',
      condition: 'excellent',
    },
    {
      productId: bedProduct.id,
      barcode: 'BD002',
      serialNumber: 'HR1000-002',
      location: 'מחסן ג׳',
      condition: 'good',
    },
    {
      productId: bedProduct.id,
      barcode: 'BD003',
      serialNumber: 'HR1000-003',
      location: 'מוקד שירות',
      condition: 'fair',
    },
    {
      productId: bedProduct.id,
      barcode: 'BD004',
      serialNumber: 'HR1000-004',
      location: 'מחסן ג׳',
      condition: 'excellent',
    },
  ];

  for (const instance of productInstances) {
    await prisma.productInstance.create({
      data: instance,
    });
  }

  console.log('✨ Database seeded successfully!');
  console.log('\n📋 Created data summary:');
  console.log(`   🔑 ${permissions.length} permissions`);
  console.log(`   👥 4 users (admin, worker, volunteer, client)`);
  console.log(`   📦 3 products`);
  console.log(`   📋 ${productInstances.length} product instances`);

  console.log('\n🔐 Login credentials:');
  console.log('   Admin:     admin@levhedva.org / Admin123!@#');
  console.log('   Worker:    worker@levhedva.org / Worker123!');
  console.log('   Volunteer: volunteer@levhedva.org / Volunteer123!');
  console.log('   Client:    client@example.com / Client123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
