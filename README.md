# 🎨 Brand Kit Generator

> AI-powered brand identity generator - Create professional brand kits in seconds

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Generate complete brand identity packages including logos, color palettes, typography, and taglines using AI - all for free!

## ✨ Features

- 🎯 **AI Logo Generation** - Unique logos powered by Stable Diffusion XL
- 🎨 **Smart Color Palettes** - Industry-optimized 5-color schemes
- 📝 **Typography Pairing** - Professional Google Fonts combinations
- 💬 **AI Taglines** - Compelling brand messaging
- 📦 **Downloadable Kit** - ZIP file with all assets + HTML preview
- 🚀 **Production-Ready** - TypeScript, ESLint, Prettier, strict mode
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 📱 **Responsive** - Mobile-first design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Hugging Face API key (free tier available)

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

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional (for better tagline generation)
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Brand Kit Generator"
```

4. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Getting API Keys

### Hugging Face (Required)

1. Create account at [huggingface.co](https://huggingface.co)
2. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with `read` access
4. Copy token to `.env.local`

**Free Tier**: ~30,000 requests/month

### OpenAI (Optional)

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Go to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Copy to `.env.local`

**Note**: OpenAI is optional. The app will use Hugging Face for taglines if OpenAI key is not provided.

## 📂 Project Structure

```
brandkit_generator/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   └── generate-brand-kit/
│   ├── privacy/             # Privacy policy
│   ├── terms/               # Terms of service
│   ├── results/             # Results display page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/              # React components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utilities and services
│   ├── api/                 # API service clients
│   │   ├── colors.ts        # Color palette generation
│   │   ├── fonts.ts         # Font pairing
│   │   ├── huggingface.ts   # HuggingFace API
│   │   └── taglines.ts      # Tagline generation
│   ├── env.ts               # Environment validation
│   ├── utils.ts             # Utility functions
│   └── validations.ts       # Zod schemas
├── types/                   # TypeScript types
├── public/                  # Static assets
├── docs/                    # Documentation
│   ├── design/              # Feature designs
│   └── testing/             # Test plans
├── claude.md                # Production standards guide
├── MVP_PLAN.md              # MVP roadmap
├── README.md                # This file
└── package.json             # Dependencies
```

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Unit tests
npm test
npm run test:coverage

# E2E tests
npm run e2e
npm run e2e:ui
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
| `npm test` | Run unit tests |
| `npm run test:coverage` | Test with coverage |
| `npm run e2e` | Run E2E tests |

## 🚢 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy**

```bash
vercel
```

3. **Add environment variables in Vercel dashboard**

Go to Project Settings → Environment Variables and add:
- `HUGGINGFACE_API_KEY`
- `OPENAI_API_KEY` (optional)
- `NEXT_PUBLIC_APP_URL` (your production URL)

4. **Redeploy**

```bash
vercel --prod
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Netlify**: `npm run build` → Deploy `.next` folder
- **Railway**: Connect GitHub repo → Auto-deploy
- **AWS Amplify**: Connect repo → Build: `npm run build`
- **Docker**: See `Dockerfile` (if you create one)

## 🔒 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HUGGINGFACE_API_KEY` | ✅ Yes | Hugging Face API key for AI generation |
| `OPENAI_API_KEY` | ❌ No | OpenAI key for better taglines (optional) |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Your app URL (for SEO/OG tags) |
| `NEXT_PUBLIC_APP_NAME` | ❌ No | App name (default: "Brand Kit Generator") |

## 🎯 How It Works

1. **User Input**: Business name, description, industry
2. **AI Processing**:
   - Logo: Stable Diffusion XL via Hugging Face
   - Colors: Algorithmic generation based on industry
   - Fonts: Curated Google Fonts pairings
   - Tagline: AI text generation (Hugging Face or OpenAI)
3. **Results**: Display all assets with preview
4. **Download**: ZIP file with logo, info text, and HTML preview

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **Forms**: React Hook Form
- **AI**: Hugging Face Inference API
- **Fonts**: Google Fonts
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)
- **Download**: JSZip
- **Testing**: Vitest + Playwright
- **Linting**: ESLint + Prettier

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Follow the [Production Standards](./claude.md)
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**AI-Generated Content**: All assets (logos, taglines) are created by AI and should be reviewed before commercial use. Always:

- Check for trademark conflicts
- Verify compliance with industry regulations
- Ensure content meets your quality standards
- Test designs across different contexts

We make no guarantees about uniqueness or originality of AI-generated content.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co) - AI model hosting
- [Google Fonts](https://fonts.google.com) - Open-source fonts
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Vercel](https://vercel.com) - Deployment platform

## 📧 Contact

- Website: [brandkitgenerator.com](https://brandkitgenerator.com)
- Issues: [GitHub Issues](https://github.com/yourusername/brandkit-generator/issues)
- Email: support@brandkitgenerator.com

## 🗺 Roadmap

- [ ] User authentication (save brand kits)
- [ ] Multiple logo variations
- [ ] Social media templates
- [ ] PDF export
- [ ] Brand guideline PDF generator
- [ ] Color palette customization
- [ ] More font options
- [ ] Vector (SVG) logo output
- [ ] API access for developers

---

**Made with ❤️ using Claude Code** - [Production Standards Guide](./claude.md)
