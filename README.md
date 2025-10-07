# 🎨 Brand Kit Generator

> AI-powered brand identity generator with team collaboration - Create professional brand kits in seconds

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Generate complete brand identity packages including SVG logos, color palettes, typography, and taglines using AI - with full authentication, team collaboration, and database persistence!

## ✨ Features

### Brand Generation
- 🎯 **AI SVG Logo Generation** - Scalable vector logos powered by Claude Sonnet 4 & Grok Code Fast
- 🎨 **Smart Color Palettes** - Psychology-based color theory with 2025 trends
- 📝 **Typography Pairing** - 50+ professionally curated Google Fonts combinations
- 💬 **AI Taglines** - Compelling brand messaging with Groq
- 🎭 **Design Justifications** - AI-powered explanations for all design choices
- 📦 **Multi-Business Support** - Create unlimited brand kits for different businesses

### Team Collaboration
- 👥 **Business Teams** - Invite team members with role-based access (Admin, Editor, Viewer)
- 🔐 **Secure Sharing** - Share brand kits via secure tokens with expiration
- ✉️ **Email Invitations** - Invite collaborators via email
- 🎫 **Access Requests** - Request access to businesses you don't own

### Authentication & Data
- 🔒 **Supabase Auth** - Email/password authentication with Row Level Security
- 💾 **Database Persistence** - All brand kits saved to PostgreSQL
- 👤 **User Accounts** - Create personal or business accounts
- 📊 **Dashboard** - View and manage all your brand kits

### Production-Ready
- 🚀 **TypeScript** - Strict mode, zero any types
- ✅ **Type-Safe** - Zod validation on all inputs
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 📱 **Responsive** - Mobile-first design
- 🛡️ **Secure** - RLS policies, input sanitization, API key protection
- 📝 **Production Standards** - Follows enterprise-grade code standards

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Supabase account (free tier available)
- OpenRouter API key (for SVG logo generation)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd brandkit_generator
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

a. Create a new project at [supabase.com](https://supabase.com)

b. Get your credentials from Settings → API:
   - Project URL
   - `anon` key (safe for client-side)
   - `service_role` key (server-only, keep secret!)

c. Run the database schema:

```bash
# Option 1: Copy the schema from supabase-schema.sql and paste into SQL Editor
# Option 2: Use Supabase CLI
supabase login
supabase link --project-ref your-project-id
supabase db push
```

d. Enable Email Auth:
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Configure email templates (optional)

4. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# OpenRouter (REQUIRED for SVG logo generation)
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Groq (OPTIONAL but recommended for AI features)
GROQ_API_KEY=your-groq-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Brand Kit Generator
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Getting API Keys

### Supabase (Required)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the URL, anon key, and service_role key
5. **Security**: NEVER expose the service_role key in client code!

**Free Tier**: 500 MB database, 50,000 monthly active users

### OpenRouter (Required)

1. Create account at [openrouter.ai](https://openrouter.ai)
2. Go to [Keys](https://openrouter.ai/keys)
3. Create a new API key
4. Add credits to your account (pay-as-you-go)

**Cost**: ~$0.01-0.05 per logo generation

### Groq (Optional but Recommended)

1. Create account at [console.groq.com](https://console.groq.com)
2. Go to API Keys
3. Create a new key

**Free Tier**: Fast inference with llama-3.1-8b-instant

## 📂 Project Structure

```
brandkit_generator/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── brand-kits/      # Brand kit CRUD
│   │   ├── businesses/      # Business management
│   │   ├── invitations/     # Team invitations
│   │   └── generate-brand-kit/ # AI generation
│   ├── dashboard/           # User dashboard
│   ├── sign-in/             # Sign in page
│   ├── sign-up/             # Sign up page
│   ├── brand-kit/[id]/      # Brand kit view page
│   ├── tools/brand-kit/     # Brand kit generator
│   ├── privacy/             # Privacy policy
│   ├── terms/               # Terms of service
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── business-card.tsx    # Business card component
│   ├── create-business-dialog.tsx
│   ├── progressive-generation.tsx
│   └── ...
├── lib/                     # Utilities and services
│   ├── api/                 # API service clients
│   │   ├── colors.ts        # Color palette generation
│   │   ├── fonts.ts         # Font pairing (50+ fonts)
│   │   ├── groq.ts          # Groq AI client
│   │   ├── svg-logo.ts      # SVG logo generation
│   │   └── taglines.ts      # Tagline generation
│   ├── services/            # Business logic layer
│   │   ├── brand-kit-service.ts
│   │   └── business-service.ts
│   ├── supabase/            # Supabase clients
│   │   ├── client.ts        # Browser client
│   │   └── server.ts        # Server client
│   ├── validations/         # Zod schemas
│   │   ├── brand-kit.ts
│   │   └── business.ts
│   ├── env.ts               # Environment validation
│   └── utils.ts             # Utility functions
├── types/                   # TypeScript types
│   └── index.ts             # Global type definitions
├── config/                  # Configuration files
│   └── templates.ts         # Business templates
├── public/                  # Static assets
├── supabase/                # Supabase files
│   └── migrations/          # Database migrations
├── CLAUDE.md                # Production standards guide
├── supabase-schema.sql      # Database schema
├── README.md                # This file
└── package.json             # Dependencies
```

## 🗄️ Database Schema

The app uses Supabase (PostgreSQL) with the following tables:

- **`auth.users`** - User authentication (managed by Supabase)
- **`businesses`** - Business entities (1 user → many businesses)
- **`brand_kits`** - Generated brand kits (1 business → 1 brand kit)
- **`business_members`** - Team members with roles (admin, editor, viewer)
- **`business_invitations`** - Email invitations with tokens
- **`business_access_requests`** - Access requests from non-members
- **`share_tokens`** - Public share links for brand kits

All tables have **Row Level Security (RLS)** policies to ensure users can only access their own data.

## 🔒 Security Architecture

### Three Levels of Supabase Clients

1. **Browser Client** (`createClient()`)
   - Uses anon key
   - Respects RLS policies
   - Used in client components

2. **Server Client** (`createClient()` from server.ts)
   - Uses anon key with user session
   - Respects RLS policies
   - Used in API routes with user context

3. **Admin Client** (`createAdminClient()`)
   - Uses service_role key
   - Bypasses ALL RLS policies
   - Use only for public share links and admin operations
   - **CRITICAL**: Never use in client code!

### RLS Policies

All database queries are protected by Row Level Security:

```sql
-- Example: Users can only view their own businesses
CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);
```

## 📊 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run type-check` | TypeScript type checking |

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect GitHub Repository**

   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel auto-detects Next.js settings

2. **Add Environment Variables**

   Go to Project Settings → Environment Variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   OPENROUTER_API_KEY=your-openrouter-key
   GROQ_API_KEY=your-groq-key
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Deploy**

   Vercel will automatically build and deploy on every push to main.

### Railway / Render

1. Connect repository
2. Add environment variables
3. Set build command: `npm run build`
4. Set start command: `npm run start`

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode, zero any types)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **AI Models**:
  - Claude Sonnet 4 (SVG logo generation via OpenRouter)
  - Grok Code Fast (SVG validation via OpenRouter)
  - Llama 3.1 70B (Groq - brand analysis)
- **Fonts**: Google Fonts (50+ curated fonts)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)
- **State Management**: React hooks + Supabase real-time (future)

## 🎯 How It Works

### Brand Kit Generation Flow

1. **User Input**
   - Select or create a business
   - Enter business description
   - Choose industry
   - Configure logo/color/font options

2. **AI Processing**
   - **Logo**: Claude Sonnet 4 generates SVG code → Grok Code Fast validates → Rendered SVG
   - **Colors**: Algorithm + AI mood analysis → 5-color psychology-based palette
   - **Fonts**: AI personality matching → Google Fonts pairing from 50+ curated fonts
   - **Tagline**: Groq Llama 3.1 → Industry-specific messaging
   - **Justifications**: AI explains color/font/design choices

3. **Database Storage**
   - Brand kit saved to Supabase with foreign key to business
   - Automatic timestamps and view tracking
   - Row Level Security ensures only owner can access

4. **Results**
   - Interactive preview with live color/font switching
   - Shareable link with secure token
   - Export options (future: ZIP download)

### Team Collaboration Flow

1. **Business Owner** creates a business
2. **Owner** invites team members via email
3. **Invited User** receives email with token link
4. **Invited User** accepts invitation
5. **Team Member** gets role-based access (admin/editor/viewer)
6. **All Members** can view and collaborate on brand kits

## 📝 Production Standards

This project follows enterprise-grade production standards defined in [CLAUDE.md](./CLAUDE.md):

- ✅ **Type Safety**: Zero `any` types, explicit return types on all functions
- ✅ **Validation**: Zod schemas on all inputs (client + server)
- ✅ **Error Handling**: Proper error types, user-friendly messages
- ✅ **Security**: RLS policies, input sanitization, API key protection
- ✅ **Accessibility**: WCAG 2.1 AA compliance (aria labels, keyboard nav, contrast)
- ✅ **Performance**: Optimistic UI, loading states, error boundaries
- ✅ **Documentation**: JSDoc on all public functions
- ✅ **Code Quality**: ESLint, Prettier, strict TypeScript

## ⚠️ Disclaimer

**AI-Generated Content**: All assets (logos, taglines, color palettes) are created by AI and should be reviewed before commercial use. Always:

- Check for trademark conflicts
- Verify compliance with industry regulations
- Ensure content meets your quality standards
- Test designs across different contexts

We make no guarantees about uniqueness or originality of AI-generated content.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Follow the [Production Standards](./CLAUDE.md)
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Database, auth, and hosting
- [OpenRouter](https://openrouter.ai) - Multi-model AI API gateway
- [Groq](https://groq.com) - Fast LLM inference
- [Google Fonts](https://fonts.google.com) - Open-source fonts
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Vercel](https://vercel.com) - Deployment platform

## 🗺 Roadmap

- [x] User authentication with Supabase
- [x] Multi-business support
- [x] Team collaboration (invitations, roles, access requests)
- [x] Secure brand kit sharing
- [x] SVG logo generation
- [ ] ZIP export with all assets
- [ ] PDF brand guidelines generator
- [ ] Real-time collaboration
- [ ] Version history for brand kits
- [ ] Social media templates
- [ ] API access for developers
- [ ] White-label solution for agencies

---

**Made with ❤️ using Claude Code** | [Production Standards](./CLAUDE.md) | [Database Schema](./supabase-schema.sql)
