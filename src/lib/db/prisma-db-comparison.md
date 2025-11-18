# Prisma Schema vs Database Actual Structure Comparison

## 📊 Comparison Overview

### ✅ Matching Tables (9/10)
- workspaces
- workspace_pages
- blog_posts
- task_boards
- task_columns
- task_tags
- task_tag_assignments
- tasks
- storage_files

### ❌ Mismatched Tables (1/10)
- **Prisma Model: `User`** → **Database Table: `user_profiles`**

## 🔍 Detailed Comparison

### 1. User / user_profiles

**Prisma Definition:**
```prisma
model User {
  id            String     @id @default(uuid())
  username      String?    @unique
  fullName      String?
  avatarUrl     String?
  website       String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @default(now()) @updatedAt
  // ...
}
```

**Actual Database Structure:**
```sql
user_profiles:
  - id (uuid, NOT NULL)
  - username (text, YES)
  - full_name (text, YES)
  - avatar_url (text, YES)
  - website (text, YES)
  - created_at (timestamp with time zone, YES, DEFAULT now())
  - updated_at (timestamp with time zone, YES, DEFAULT now())
```

**Issues:**
- ❌ Table name mismatch: `User` vs `user_profiles`
- ⚠️ Column names use snake_case, Prisma uses camelCase (requires mapping)

**Solution:**
```prisma
model User {
  id            String     @id @default(uuid())
  username      String?    @unique
  fullName      String?    @map("full_name")
  avatarUrl     String?    @map("avatar_url")
  website       String?
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  
  workspaces    Workspace[]
  blogPosts     BlogPost[]
  taskBoards    TaskBoard[]
  taskTags      TaskTag[]
  storageFiles  StorageFile[]
  
  @@map("user_profiles")
}
```

### 2. Column Mapping for Other Tables

All tables need `@map` to map snake_case column names:

**Example: Workspace**
```prisma
model Workspace {
  id            String          @id @default(uuid())
  userId        String          @map("user_id")
  user          User            @relation(fields: [userId], references: [id])
  name          String
  icon          String?
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  workspacePages WorkspacePage[]
}
```

## 🔧 Issues to Fix

### High Priority 🔴

1. **User Model Table Name Mapping**
   ```prisma
   @@map("user_profiles")
   ```

2. **All Foreign Key Column Mapping**
   - `userId` → `user_id`
   - `boardId` → `board_id`
   - `columnId` → `column_id`
   - `parentId` → `parent_id`
   - `workspaceId` → `workspace_id`

3. **Timestamp Column Mapping**
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

### Medium Priority 🟡

4. **Other Column Mapping**
   - `fullName` → `full_name`
   - `avatarUrl` → `avatar_url`
   - `bucketName` → `bucket_name`
   - `filePath` → `file_path`
   - `fileName` → `file_name`
   - `fileSize` → `file_size`
   - `mimeType` → `mime_type`
   - `entityType` → `entity_type`
   - `entityId` → `entity_id`
   - `dueDate` → `due_date`

## 📝 Complete Corrected Prisma Schema

See file: `lib/db/corrected-schema.prisma`

## ✅ Verification Steps

After correction, run the following commands to verify:

```bash
# 1. Format schema
npx prisma format

# 2. Validate schema
npx prisma validate

# 3. Generate Prisma Client
npx prisma generate

# 4. Compare with database (won't modify database)
npx prisma db pull --print
```

## 🎯 Next Steps

1. ✅ Fix Prisma Schema
2. ✅ Add AI Tasky new tables (according to upgrade documentation)
3. ✅ Create migration files
4. ✅ Test database connection

## 📚 References

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Mapping model names](https://www.prisma.io/docs/concepts/components/prisma-schema/names-in-underlying-database#mapping-model-names-to-tables-or-collections)
