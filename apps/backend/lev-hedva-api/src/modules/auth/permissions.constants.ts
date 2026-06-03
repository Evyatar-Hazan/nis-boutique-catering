export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_PERMISSIONS: 'user:manage_permissions',

  // Product permissions
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_MANAGE: 'product:manage',

  // Loan permissions
  LOAN_CREATE: 'loan:create',
  LOAN_READ: 'loan:read',
  LOAN_UPDATE: 'loan:update',
  LOAN_DELETE: 'loan:delete',
  LOAN_RETURN: 'loan:return',
  LOAN_OVERDUE: 'loan:overdue',

  // Volunteer permissions
  VOLUNTEER_CREATE: 'volunteer:create',
  VOLUNTEER_READ: 'volunteer:read',
  VOLUNTEER_UPDATE: 'volunteer:update',
  VOLUNTEER_DELETE: 'volunteer:delete',
  VOLUNTEER_STATS: 'volunteer:stats',
  VOLUNTEER_REPORTS: 'volunteer:reports',

  // Admin permissions
  ADMIN_FULL: 'admin:full',
  ADMIN_USERS: 'admin:users',
  ADMIN_SYSTEM: 'admin:system',
  ADMIN_AUDIT: 'admin:audit',
} as const;

export const ROLE_PERMISSIONS = {
  ADMIN: [
    PERMISSIONS.ADMIN_FULL,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_PERMISSIONS,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_MANAGE,
    PERMISSIONS.LOAN_CREATE,
    PERMISSIONS.LOAN_READ,
    PERMISSIONS.LOAN_UPDATE,
    PERMISSIONS.LOAN_DELETE,
    PERMISSIONS.LOAN_RETURN,
    PERMISSIONS.LOAN_OVERDUE,
    PERMISSIONS.VOLUNTEER_CREATE,
    PERMISSIONS.VOLUNTEER_READ,
    PERMISSIONS.VOLUNTEER_UPDATE,
    PERMISSIONS.VOLUNTEER_DELETE,
    PERMISSIONS.VOLUNTEER_STATS,
    PERMISSIONS.VOLUNTEER_REPORTS,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_SYSTEM,
    PERMISSIONS.ADMIN_AUDIT,
  ],
  WORKER: [
    // User permissions - read only, cannot create/update/delete users or manage permissions
    PERMISSIONS.USER_READ,

    // Full product permissions
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_MANAGE,

    // Full loan permissions
    PERMISSIONS.LOAN_CREATE,
    PERMISSIONS.LOAN_READ,
    PERMISSIONS.LOAN_UPDATE,
    PERMISSIONS.LOAN_DELETE,
    PERMISSIONS.LOAN_RETURN,
    PERMISSIONS.LOAN_OVERDUE,

    // Full volunteer permissions
    PERMISSIONS.VOLUNTEER_CREATE,
    PERMISSIONS.VOLUNTEER_READ,
    PERMISSIONS.VOLUNTEER_UPDATE,
    PERMISSIONS.VOLUNTEER_DELETE,
    PERMISSIONS.VOLUNTEER_STATS,
    PERMISSIONS.VOLUNTEER_REPORTS,
  ],
  VOLUNTEER: [
    // Volunteers can only view their own activities and register for open activities
    PERMISSIONS.VOLUNTEER_READ,
    PERMISSIONS.VOLUNTEER_CREATE,
  ],
  CLIENT: [
    // Clients can only view their own active loans - no create, update, or delete
    PERMISSIONS.LOAN_READ,
  ],
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type Role = keyof typeof ROLE_PERMISSIONS;
