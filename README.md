# NZLouis AI Tasky

A powerful AI-powered task management and blogging platform with intelligent chat capabilities.

## Features

### 🤖 AI Tasky
- **Smart Chat Sessions**: Create, manage, and organize AI conversations
- **Message Persistence**: All conversations saved and searchable
- **Image Support**: Upload images, paste screenshots (Ctrl+V)
- **Session Management**: Search, rename, and delete sessions
- **Real-time Streaming**: Live AI responses
- **Auto-save**: Messages automatically saved

### 📝 Blog
- **Rich Text Editor**: Powered by BlockNote
- **Hierarchical Structure**: Organize posts in nested structure
- **Image Upload**: Cover images and content images
- **AI Assistant**: AI-powered content modification
- **Auto-save**: Changes saved automatically every 2 seconds
- **Save Status**: Real-time save status indicator

### 🔒 Security
- NextAuth.js authentication
- Row Level Security (RLS)
- API key encryption (AES-256-GCM)
- User data isolation
- File validation
- Secure storage

### ⚡ Performance
- Image compression
- Lazy loading
- CDN caching
- Code splitting
- Optimized queries
- Fast page loads

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **AI**: Google Gemini API
- **Auth**: NextAuth.js
- **Editor**: BlockNote

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Google Cloud account (for Gemini API)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd nzlouis-ai-tasky

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables (see docs/SETUP.md)

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

- [Setup Guide](docs/SETUP.md) - Complete setup instructions
- [Performance Guide](docs/PERFORMANCE.md) - Performance optimization
- [Security Guide](docs/SECURITY.md) - Security best practices
- [Admin Authentication](docs/admin-auth/) - Admin认证系统文档
- [Completion Report](jira/COMPLETION_REPORT.md) - Implementation details

## Project Structure

```
nzlouis-ai-tasky/
├── app/                    # Next.js app directory
│   ├── ai-tasky/          # AI Tasky pages
│   ├── blog/              # Blog pages
│   └── api/               # API routes
├── components/            # React components
│   ├── blog/             # Blog components
│   └── ui/               # UI components
├── lib/                   # Utilities and services
│   ├── services/         # Business logic
│   ├── stores/           # State management
│   └── supabase/         # Database clients
├── docs/                  # Documentation
├── supabase/             # Database migrations
└── __tests__/            # Test files
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Testing
npm test                # Run tests
npm test -- --coverage  # Run with coverage

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript
```

## Environment Variables

See `.env.example` for complete list. Key variables:

```env

# AI
GOOGLE_API_KEY=
GEMINI_API_URL=

# Auth
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Encryption
AI_ENCRYPTION_KEY=
```

## Features in Detail

### AI Tasky
- Create unlimited chat sessions
- Upload images and screenshots
- Search through conversations
- Rename and organize sessions
- Real-time AI responses
- Message history

### Blog
- Create nested blog posts
- Rich text editing
- Upload cover images
- Insert images in content
- AI-powered editing
- Auto-save functionality

## API Endpoints

### Chat Sessions
- `GET /api/chat-sessions` - List sessions
- `POST /api/chat-sessions` - Create session
- `GET /api/chat-sessions/[id]` - Get session
- `PATCH /api/chat-sessions/[id]` - Update session
- `DELETE /api/chat-sessions/[id]` - Delete session

### Blog
- `POST /api/blog/ai-modify` - AI modification
- `POST /api/blog/apply-modifications` - Apply changes

### Storage
- `POST /api/upload` - Upload images
- `GET /api/cleanup` - Scan orphaned files

## Database Schema

### Main Tables
- `chat_sessions` - Chat sessions
- `chat_messages` - Messages
- `blog_posts` - Blog posts
- `storage_files` - File metadata
- `user_ai_settings` - User preferences
- `user_api_keys` - Encrypted API keys

## Security

- All API routes require authentication
- Row Level Security on all tables
- API keys encrypted with AES-256-GCM
- File type and size validation
- User data isolation
- Secure file storage

## Performance

- Image compression for files >1MB
- Lazy loading with Next.js Image
- Debounced auto-save (2s)
- CDN caching (3600s)
- Connection pooling
- Indexed database queries

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- path/to/test
```

Current test status:
- ✅ 17/17 test suites passing
- ✅ 58/58 tests passing
- ⚠️ Coverage: 2.38% (target: 80%)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check [documentation](docs/)
- Review [setup guide](docs/SETUP.md)
- Check [security guide](docs/SECURITY.md)

## Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Google for Gemini AI API
- BlockNote for the rich text editor

---

**Status**: ✅ Production Ready  
**Build**: ✅ Passing  
**Tests**: ✅ Passing  
**Version**: 2.0
