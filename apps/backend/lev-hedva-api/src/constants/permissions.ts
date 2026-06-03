export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  USERS_DELETE: 'users.delete',
  
  PRODUCTS_READ: 'products.read',
  PRODUCTS_WRITE: 'products.write',
  PRODUCTS_DELETE: 'products.delete',
  
  LOANS_READ: 'loans.read',
  LOANS_WRITE: 'loans.write',
  LOANS_DELETE: 'loans.delete',
  
  VOLUNTEERS_READ: 'volunteers.read',
  VOLUNTEERS_WRITE: 'volunteers.write',
  VOLUNTEERS_DELETE: 'volunteers.delete',
  
  AUDIT_READ: 'audit.read',
  
  PERMISSIONS_MANAGE: 'permissions.manage',
  
  SYSTEM_MANAGE: 'system.admin',
} as const;