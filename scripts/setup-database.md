# Quick Database Connection Setup

## 🚀 Quick Start

### Method 1: Manual Configuration (Recommended)

1. **Get Database Password**
   - Visit: https://supabase.com/dashboard/project/nkpgzczvxuhbqrifjuer/settings/database
   - Copy the password from Connection string

2. **Update .env File**
   
   Add to the end of `.env` file:
   ```bash
   # Prisma database connection
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.nkpgzczvxuhbqrifjuer.supabase.co:5432/postgres"
   ```

3. **Verify Configuration**
   ```bash
   npx prisma validate
   npx prisma generate
   ```

### Method 2: Use Existing Supabase Configuration

If you don't want to expose the database password, you can use Supabase Service Role Key:

```bash
# Add to .env
DATABASE_URL="postgresql://postgres.nkpgzczvxuhbqrifjuer:[SERVICE-ROLE-KEY]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

## ✅ Verification Steps

Run the following commands to confirm successful configuration:

```bash
# 1. Format schema
npx prisma format

# 2. Validate schema
npx prisma validate

# 3. Generate Prisma Client
npx prisma generate

# 4. View database status
npx prisma db pull --print
```

## 📋 After Configuration

Continue with:

1. ✅ Queries 3-8 (primary keys, foreign keys, indexes)
2. ✅ Add AI Tasky new tables
3. ✅ Start development

---

**Need help?** See `lib/db/SETUP_DATABASE.md` for detailed instructions
