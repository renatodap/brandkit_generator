# Brand Kit Generator - MVP Plan (1 Hour Build)

## Core Concept
A minimal viable brand kit generator that takes a business name and description, then produces a complete downloadable brand identity package using free AI APIs.

---

## MVP Features (Hour 1 - No Login Required)

### Input (Single Form)
- **Business Name** (text input)
- **Business Description** (textarea, 2-3 sentences)
- **Industry/Category** (dropdown: Tech, Food, Fashion, Health, Creative, Other)
- **Generate Button**

### Output (Brand Kit Package)
1. **Logo** (1 AI-generated logo, PNG format)
2. **Color Palette** (5 colors with hex codes)
3. **Typography Recommendation** (2 fonts: primary + secondary from Google Fonts)
4. **Tagline/Slogan** (AI-generated, 1 option)
5. **Brand Colors Preview Card** (visual display of the palette)

### Delivery
- Single-page display of all assets
- Download button for ZIP file containing:
  - Logo PNG
  - `brand_kit.txt` with colors, fonts, and tagline
  - Simple HTML preview file

---

## Tech Stack (Free Tools Only)

### Frontend
- **Framework**: Next.js 14 (App Router) or Vite + React
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (free tier)

### Backend
- **API Routes**: Next.js API routes (serverless)
- **No database needed** for MVP (stateless generation)

### AI Services (Free Tiers)
1. **Logo Generation**:
   - Option A: Replicate API (Stable Diffusion XL) - Free credits
   - Option B: Hugging Face Inference API (SDXL) - Free

2. **Color Palette**:
   - Huemint API (free tier) or
   - Custom algorithm using OpenAI/color theory

3. **Typography**:
   - Google Fonts API (free, filtered by industry)

4. **Copywriting (Tagline)**:
   - OpenAI GPT-3.5-turbo (free trial credits) or
   - Hugging Face text generation (free)

5. **Asset Compilation**:
   - JSZip (client-side ZIP generation)
   - HTML Canvas for color palette cards

---

## User Flow (60 Second Experience)

1. User lands on homepage
2. Fills out 3-field form (name, description, industry)
3. Clicks "Generate Brand Kit"
4. Loading state (15-30 seconds)
5. Results page displays all assets
6. User downloads ZIP file
7. (Optional) User can regenerate or tweak

---

## File Structure

```
brandkit-mvp/
├── app/
│   ├── page.tsx                 # Homepage with form
│   ├── results/page.tsx         # Results display
│   ├── api/
│   │   ├── generate-logo/route.ts
│   │   ├── generate-palette/route.ts
│   │   ├── generate-tagline/route.ts
│   │   └── generate-fonts/route.ts
├── components/
│   ├── BrandForm.tsx
│   ├── BrandKitDisplay.tsx
│   ├── ColorPalette.tsx
│   └── DownloadButton.tsx
├── lib/
│   ├── ai-services.ts          # API integrations
│   └── zip-generator.ts        # ZIP creation logic
└── public/
```

---

## Database Considerations for V2 (Not MVP)

If we add user accounts later:
- **Supabase** (free tier: auth + postgres)
- **Clerk** (free tier: auth only)
- Store: user_id, brand_kits (JSON), created_at

For MVP: **No database** - everything generated on-demand, client downloads

---

## What We Skip for MVP (Hour 1)

- ❌ User authentication/login
- ❌ Saving/history of generated kits
- ❌ Multiple logo variations
- ❌ Advanced customization (color tweaking, font swapping)
- ❌ Mockups/product visualization
- ❌ Social media templates
- ❌ PDF/print-ready exports
- ❌ Payment/premium features

---

## Success Metrics for MVP

- User can generate a brand kit in < 60 seconds
- All assets are downloadable
- Zero crashes on generation
- At least 70% of logos are "acceptable quality"
- Color palettes are harmonious
- Fonts match industry vibe

---

## Next Steps (Post-MVP)

1. Add user authentication (Clerk/Supabase)
2. Save brand kits to database
3. Multiple logo variations (3-5 options)
4. Regenerate individual components
5. Export to different formats (PDF, Canva template)
6. Social media asset templates

---

## Perplexity Research Prompt (Copy Below)

```
I'm building a brand kit generator MVP with Next.js that needs to be 100% free (using free tiers only).
I need to generate:
1. AI logos from text prompts
2. Color palettes (5 colors)
3. Font pairings from Google Fonts
4. AI taglines/slogans

Requirements:
- All APIs must have a FREE tier (no credit card for trial)
- Must work with Next.js 14 API routes
- Need API documentation links
- Prioritize: Hugging Face, Replicate free credits, Google APIs, open source options
- Must support commercial use (at least for testing)

Please provide:
- Specific API names with free tier limits
- Code examples or SDK links for Next.js integration
- Alternative free options for each category
- Any rate limits or restrictions
- How to authenticate (API keys, tokens, etc.)

Focus on tools that are production-ready and have been tested in 2024-2025.
```

---

## Implementation Checklist

- [ ] Set up Next.js 14 project with Tailwind
- [ ] Create form component with 3 inputs
- [ ] Integrate free logo generation API (Hugging Face SDXL)
- [ ] Integrate color palette API or algorithm
- [ ] Integrate Google Fonts API with industry filters
- [ ] Integrate free LLM for tagline (GPT-3.5 or HF)
- [ ] Build results display page
- [ ] Implement client-side ZIP download (JSZip)
- [ ] Add loading states and error handling
- [ ] Deploy to Vercel
- [ ] Test end-to-end flow

---

## Estimated Timeline

- **0-15 min**: Project setup, form UI
- **15-30 min**: API integrations (logo, color, fonts, tagline)
- **30-45 min**: Results page, asset display
- **45-55 min**: ZIP download implementation
- **55-60 min**: Testing, bug fixes, deploy

Total: **60 minutes** for core MVP
