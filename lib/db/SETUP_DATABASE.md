# Database Connection Configuration Guide

## 🔑 Step 1: Get Database Password

1. Visit Supabase Dashboard:
   https://supabase.com/dashboard/project/nkpgzczvxuhbqrifjuer/settings/database

2. Find the "Connection string" section

3. Select "URI" format and copy the connection string

## 📝 Step 2: Configure Environment Variables

Add (or update) in `.env` file:

```bash
# Prisma database connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.nkpgzczvxuhbqrifjuer.supabase.co:5432/postgres"
```

**Note:** Replace `[YOUR-PASSWORD]` with your actual password from Supabase

### Complete Example:

```bash
# If password is mySecretPassword123
DATABASE_URL="postgresql://postgres:mySecretPassword123@db.nkpgzczvxuhbqrifjuer.supabase.co:5432/postgres"
```

## ✅ Step 3: Verify Connection

After configuration, run the following commands to verify:

```bash
# 1. Validate schema
npx prisma validate

# 2. Generate Prisma Client
npx prisma generate

# 3. Test connection (optional)
npx prisma db execute --stdin <<< "SELECT 1"
```

## 🎯 Expected Output

### Successful Validation Output:
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

✔ Prisma schema is valid!
```

### Successful Generation Output:
```
✔ Generated Prisma Client (v6.16.2) to .\node_modules\@prisma\client
```

## ❌ Common Issues

### Issue 1: "Environment variable not found: DATABASE_URL"

**Cause:** DATABASE_URL not configured in `.env` file

**Solution:** Add DATABASE_URL in `.env`

### Issue 2: "Can't reach database server"

**Cause:** 
- Incorrect password
- Network connection issues
- Supabase project paused

**Solution:**
1. Check if password is correct
2. Confirm network can access Supabase
3. Check Supabase project status

### Issue 3: "Authentication failed"

**Cause:** Incorrect password or special characters not escaped

**Solution:** 
- Confirm password is correct
- If password contains special characters (like @, #, $), URL encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`

## 📚 Next Steps

After configuration is complete, continue with:

1. ✅ Complete queries 3-8 (get primary keys, foreign keys, etc.)
2. ✅ Implement AI Tasky upgrade plan

## 🔗 Reference Links

- [Supabase Database Settings](https://supabase.com/dashboard/project/nkpgzczvxuhbqrifjuer/settings/database)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
