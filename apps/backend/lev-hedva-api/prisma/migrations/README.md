# Permission Migration Script

This script updates the permission format from `resource.action` to `resource:action` without losing any data.

## When to use

Use this script when you need to update permissions in production without resetting the database.

## How to run

### Development

```bash
npx ts-node prisma/migrations/update-permissions.ts
```

### Production

```bash
# Using npx
npx ts-node prisma/migrations/update-permissions.ts

# Or if ts-node is installed globally
ts-node prisma/migrations/update-permissions.ts
```

## What it does

1. ✅ Updates existing permission names from old format to new format
2. ✅ Creates missing permissions
3. ✅ Updates all worker permissions
4. ✅ Updates all admin permissions
5. ✅ Preserves all existing data (users, products, loans, etc.)

## Permission mappings

| Old Format         | New Format     |
| ------------------ | -------------- |
| users.read         | user:read      |
| users.write        | user:create    |
| users.delete       | user:delete    |
| products.read      | product:read   |
| products.write     | product:create |
| products.delete    | product:delete |
| loans.read         | loan:read      |
| loans.write        | loan:create    |
| loans.delete       | loan:delete    |
| permissions.manage | admin:users    |
| audit.read         | admin:audit    |

## New permissions added

- `user:update` - Update users
- `product:update` - Update products
- `product:manage` - Manage products
- `loan:update` - Update loans
- `loan:return` - Return loans
- `loan:overdue` - Manage overdue loans
- `admin:full` - Full admin access
- `admin:system` - System administration

## Safe to run multiple times

This script is idempotent - you can run it multiple times safely. It will skip permissions that already exist.
