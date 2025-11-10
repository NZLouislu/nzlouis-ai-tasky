#!/bin/bash

# ============================================
# 使用 Supabase CLI 获取数据库结构
# ============================================

# 前提：需要安装 Supabase CLI
# npm install -g supabase

# 设置环境变量
export SUPABASE_URL="https://nkpgzczvxuhbqrifjuer.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGd6Y3p2eHVoYnFyaWZqdWVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA2ODc2MiwiZXhwIjoyMDcyNjQ0NzYyfQ.4EEs2YbHZEzkkSt3qOSQ9NiqPgwJE-COmPX_wu8ZI9Y"

# 获取数据库结构
echo "Fetching database schema..."

# 方法 1: 使用 pg_dump（如果有访问权限）
# pg_dump -h db.nkpgzczvxuhbqrifjuer.supabase.co -U postgres -d postgres --schema-only > schema.sql

# 方法 2: 使用 Supabase CLI
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.nkpgzczvxuhbqrifjuer.supabase.co:5432/postgres" > schema.sql

echo "Schema saved to schema.sql"
