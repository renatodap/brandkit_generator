# 🚀 Quick Start Guide

Get your Brand Kit Generator up and running in 5 minutes!

## Step 1: Get Your Hugging Face API Key (FREE)

1. Go to [huggingface.co](https://huggingface.co) and create a free account
2. Click your profile picture → **Settings**
3. Click **Access Tokens** in the left sidebar
4. Click **New token**
   - Name: "Brand Kit Generator"
   - Type: **Read**
5. Click **Generate a token**
6. **Copy the token** (starts with `hf_...`)

## Step 2: Set Up Your Environment

Open `.env.local` file and paste your Hugging Face API key:

```bash
HUGGINGFACE_API_KEY=hf_your_actual_key_here
```

**Important**: Replace `hf_your_api_key_here` with your actual key!

## Step 3: Install & Run

```bash
# Install dependencies (one time only)
npm install

# Start the development server
npm run dev
```

## Step 4: Open Your Browser

Go to [http://localhost:3000](http://localhost:3000)

## Step 5: Generate Your First Brand Kit!

1. Enter your business name (e.g., "TechVision Solutions")
2. Describe your business (2-3 sentences)
3. Select your industry
4. Click **Generate Brand Kit**
5. Wait 10-30 seconds (AI is working!)
6. Download your complete brand kit as a ZIP file

---

## 🎉 You're Done!

Your brand kit includes:
- ✅ AI-generated logo (PNG)
- ✅ 5-color palette with hex codes
- ✅ Professional font pairing (Google Fonts)
- ✅ AI-generated tagline
- ✅ HTML preview file
- ✅ Text file with all details

---

## ⚡ Pro Tips

### Faster Logo Generation
The first generation takes 20-30 seconds (AI model is "waking up"). Subsequent generations are faster (5-10 seconds).

### Better Results
- Be specific in your description
- Mention your target audience
- Include key brand values or unique selling points

### Example Inputs

**Tech Startup:**
- Name: "CodeFlow"
- Description: "AI-powered code review platform helping developers write better, more secure code faster"
- Industry: Technology

**Food Business:**
- Name: "Green Harvest"
- Description: "Organic farm-to-table restaurant serving locally sourced, seasonal ingredients with a focus on sustainability"
- Industry: Food & Beverage

**Fashion Brand:**
- Name: "Urban Edge"
- Description: "Contemporary streetwear brand blending minimalist design with bold statement pieces for the modern urban lifestyle"
- Industry: Fashion & Apparel

---

## 🐛 Troubleshooting

### "Failed to generate logo"
- **Check your API key**: Make sure it starts with `hf_` and is correctly pasted in `.env.local`
- **Restart the server**: Stop (Ctrl+C) and run `npm run dev` again
- **Check your internet**: The app needs internet to call AI APIs

### "Error loading results"
- Clear your browser cache
- Try in incognito/private mode
- Make sure JavaScript is enabled

### Build errors
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run build
```

---

## 📚 What's Next?

### Deploy Your App
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add your HUGGINGFACE_API_KEY in Vercel dashboard
# Project Settings → Environment Variables
```

### Customize the App
- Edit colors in `tailwind.config.ts`
- Modify the form in `app/page.tsx`
- Add more features (check `MVP_PLAN.md` for ideas)

### Learn the Codebase
- Read `README.md` for full documentation
- Check `claude.md` for production standards
- Explore `lib/api/` for AI integration examples

---

## 🆘 Need Help?

- **Documentation**: See `README.md`
- **API Issues**: Check `lib/api/README.md`
- **Production Guide**: See `claude.md`
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/brandkit-generator/issues)

---

**Happy Branding! 🎨**
