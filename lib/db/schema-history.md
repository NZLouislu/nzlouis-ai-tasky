# Database Structure Change History

## 📅 2025-01-08 - Initialization

### Actions
- Created database structure documentation system
- Prepared to pull current structure from Supabase

### Status
Waiting for screenshot recognition...

---

## 📝 Change Record Template

After each database structure update, record here:

### YYYY-MM-DD - Change Title

**Change Type:** Add Table / Modify Table / Delete Table / Add Column / Modify Column / Delete Column

**Scope:**
- Table name: xxx
- Operation: xxx

**SQL Statement:**
```sql
-- SQL statement for the change
```

**Prisma Schema Change:**
```prisma
// Corresponding Prisma model change
```

**Reason:**
Explain why this change was made

**Impact:**
- Impact on existing features
- Required data migration

---

## 🔮 Planned Changes

### AI Tasky Feature Upgrade

According to `tasks/使用 Next.js AI Chatbot (Vercel AI SDK) 升级并扩展 Chatbot 功能.md`, planned additions:

1. **NextAuth Related Tables**
   - Account
   - Session
   - VerificationToken

2. **AI Chat Related Tables**
   - ChatSession
   - ChatMessage
   - UserAISettings
   - UserAPIKey

3. **Document Management Tables**
   - Document
   - Story
   - ExportConfig

See upgrade documentation Section 3 for detailed structure.
