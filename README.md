# nzlouis-ai-tasky

An AI-driven task management and content creation platform based on Next.js, integrating blog management, chatbot, task lists, and workspace features.

## Features

- **Workspaces**: Personal diary and mind mapping, supporting hierarchical page structures
- **Blog System**: Personal blog articles, supporting hierarchical structures
- **Task Management**: Project-based task management, supporting subtasks (Notion-style)
- **AI Chatbot**: Integrated AI-powered chat interface
- **Comment System**: Blog article commenting functionality
- **Data Analytics**: Blog article access statistics and analysis

## Tech Stack

- **Frontend**: React 19.1.0 + Next.js 15.5.2 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase + PostgreSQL
- **ORM**: Prisma (optional)
- **AI Services**: @assistant-ui/react + assistant-ui
- **State Management**: Zustand 5.0.8
- **Data Fetching**: @tanstack/react-query 5.87.1
- **Rich Text Editor**: @blocknote/core + @blocknote/react
- **UI Components**: @radix-ui/react-icons, lucide-react

## Database Design

### 1. Workspaces

Workspaces represent personal diaries and mind mapping. Each workspace can have multiple pages, and pages can have hierarchical structures with subpages, supporting unlimited nesting levels.

### 2. Blogs

Blogs represent personal blog articles, supporting hierarchical structures, allowing creation of unlimited levels of sub-articles.

### 3. Tasks

Tasks represent project-based task management, supporting Notion-style subtasks, allowing creation of unlimited levels of subtasks.

## Database Setup

### Using Supabase (Recommended)

1. Create a new project on [Supabase](https://supabase.io/)
2. Get the project URL and anon/service role keys
3. Configure environment variables in the `.env` file:

```env
TASKY_SUPABASE_URL=your_supabase_url
TASKY_SUPABASE_ANON_KEY=your_supabase_anon_key
TASKY_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run the database initialization script:
   - Open the Supabase project console
   - Go to SQL Editor
   - Copy and run the SQL script from `lib/db/init.sql`

### Using Prisma (Optional)

1. Install Prisma CLI:
```bash
npm install prisma --save-dev
```

2. Initialize Prisma:
```bash
npx prisma init
```

3. Configure database connection:
Set `DATABASE_URL` in the `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Run database migration:
```bash
npx prisma migrate dev --name init
```

## Environment Variables Configuration

Copy the `.env.example` file and rename it to `.env`, then fill in the corresponding values:

```bash
cp .env.example .env
```

## Development Environment Setup

1. Clone the project:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (refer to the instructions above)

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
.
├── app/                    # Next.js pages and API routes
│   ├── api/                # Backend API routes
│   ├── blog/               # Blog pages
│   ├── chatbot/            # Chatbot pages
│   ├── tasklist/           # Task list pages
│   └── workspace/          # Workspace pages
├── components/             # React components
├── lib/                    # Core logic and utility functions
│   ├── stores/             # Zustand state management
│   ├── supabase/           # Supabase client
│   └── db/                 # Database related files
└── prisma/                 # Prisma schema files
```

## API Endpoints

### Workspace API

```
GET    /api/workspaces                    # Get all workspaces
POST   /api/workspaces                    # Create new workspace
GET    /api/workspaces/{id}              # Get specific workspace
PUT    /api/workspaces/{id}              # Update workspace
DELETE /api/workspaces/{id}              # Delete workspace

GET    /api/workspaces/{id}/pages        # Get all pages in workspace
POST   /api/workspaces/{id}/pages        # Create new page in workspace
GET    /api/pages/{id}                   # Get specific page
PUT    /api/pages/{id}                   # Update page
DELETE /api/pages/{id}                   # Delete page
POST   /api/pages/{id}/children          # Create subpage for page
```

### Blog API

```
GET    /api/blog/posts                   # Get all blog posts
POST   /api/blog/posts                   # Create new blog post
GET    /api/blog/posts/{id}             # Get specific blog post
PUT    /api/blog/posts/{id}             # Update blog post
DELETE /api/blog/posts/{id}             # Delete blog post
POST   /api/blog/posts/{id}/children     # Create sub-article for post
```

### Task API

```
GET    /api/tasks/boards                 # Get all task boards
POST   /api/tasks/boards                 # Create new task board
GET    /api/tasks/boards/{id}           # Get specific task board
PUT    /api/tasks/boards/{id}           # Update task board
DELETE /api/tasks/boards/{id}           # Delete task board

GET    /api/tasks/boards/{id}/columns   # Get all columns in board
POST   /api/tasks/boards/{id}/columns   # Create new column in board
GET    /api/tasks/columns/{id}          # Get specific column
PUT    /api/tasks/columns/{id}          # Update column
DELETE /api/tasks/columns/{id}          # Delete column

GET    /api/tasks/columns/{id}/tasks    # Get all tasks in column
POST   /api/tasks/columns/{id}/tasks    # Create new task in column
GET    /api/tasks/{id}                  # Get specific task
PUT    /api/tasks/{id}                  # Update task
DELETE /api/tasks/{id}                  # Delete task
POST   /api/tasks/{id}/subtasks          # Create subtask for task
```

## Deployment

### Vercel (Recommended)

1. Push the project to a GitHub repository
2. Log in to [Vercel](https://vercel.com) and import the project
3. Configure environment variables in the build settings
4. Automatically assign a domain after successful deployment

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

Welcome to submit Issues and Pull Requests to improve this project.

## License

[MIT](LICENSE)