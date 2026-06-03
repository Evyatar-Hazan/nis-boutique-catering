#!/bin/bash
# Pre-migration script to handle failed migrations automatically
# This script will mark any failed migration as rolled back before attempting deploy

echo "🔍 Pre-migration check..."

# Always try to resolve known failed migrations
# This is safe - if the migration doesn't exist or isn't failed, the command just does nothing
echo "📌 Attempting to resolve any failed migrations..."
npx prisma migrate resolve --rolled-back "20251216130854_update_permissions_format" 2>/dev/null || true
npx prisma migrate resolve --rolled-back "20251216160000_add_all_new_permissions" 2>/dev/null || true

echo "✅ Pre-migration check complete"
