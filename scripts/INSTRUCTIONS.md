# Methods to Get Supabase Database Structure

## 🎯 Recommended Method: Prisma Introspection (Easiest)

### Step 1: Configure Database Connection

Add (or update) in `.env` file:

```bash
# Prisma database connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.nkpgzczvxuhbqrifjuer.supabase.co:5432/postgres"
```

**Note:** You need to get the database password from Supabase Dashboard:
1. Visit https://supabase.com/dashboard/project/nkpgzczvxuhbqrifjuer/settings/database
2. Copy the password from "Connection string"

### Step 2: Initialize Prisma (if not already done)

```bash
npm install -D prisma
npx prisma init
```

### Step 3: Pull Structure from Database

```bash
npx prisma db pull
```

This will automatically generate `prisma/schema.prisma` file with all table structures!

### Step 4: View Generated Schema

```bash
cat prisma/schema.prisma
```

Then send me the content, and I'll help integrate it into the documentation.

---

## 🔧 Alternative Method 1: Execute Queries in Supabase SQL Editor

1. Visit Supabase Dashboard: https://supabase.com/dashboard/project/nkpgzczvxuhbqrifjuer/editor
2. Open SQL Editor
3. Execute queries from `scripts/get-supabase-schema.sql`
4. Copy results to me

---

## 🔧 Alternative Method 2: Use Node.js Script

```bash
# Install dependencies
npm install @supabase/supabase-js

# Run script
node scripts/get-supabase-schema.js
```

---

## 🔧 Alternative Method 3: Manual Query

Execute in Supabase SQL Editor:

```sql
-- View all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- View table structure
\d+ your_table_name
```

---

## 📋 Information I Need

Please provide data in any of the following formats:

### Format 1: Prisma Schema (Best)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  // ...
}
```

### Format 2: SQL CREATE TABLE Statements
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  // ...
);
```

### Format 3: JSON Format
```json
{
  "tables": [
    {
      "name": "users",
      "columns": [
        {"name": "id", "type": "uuid", "nullable": false},
        {"name": "email", "type": "varchar", "nullable": false}
      ]
    }
  ]
}
```

---

## ❓ Common Issues

**Q: Can't find database password?**
A: In Supabase Dashboard → Settings → Database → Connection string

**Q: Prisma connection failed?**
A: Check:
1. Is password correct
2. Is database URL format correct
3. Can network access Supabase

**Q: Prisma not installed?**
A: Run `npm install -D prisma @prisma/client`
