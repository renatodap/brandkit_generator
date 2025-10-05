# 🎬 Get Started in 3 Simple Steps

## ⏱️ Total Time: 5 Minutes

---

## Step 1: Get Your FREE Hugging Face API Key (2 minutes)

### Why you need this:
Hugging Face powers the AI logo and tagline generation. It's free and takes 2 minutes.

### How to get it:

1. **Go to** [huggingface.co](https://huggingface.co)

2. **Sign up** (it's free!)
   - Click "Sign Up" in top right
   - Use email or GitHub/Google

3. **Create an API token**
   - Click your profile picture → **Settings**
   - Click **Access Tokens** (left sidebar)
   - Click **New token** button
   - Name it: `Brand Kit Generator`
   - Type: Select **Read** (that's all you need)
   - Click **Generate a token**

4. **Copy your token**
   - It starts with `hf_...`
   - **Keep this safe!** You'll need it in Step 2

---

## Step 2: Configure Your Environment (1 minute)

### Open the `.env.local` file in this folder

You'll see:
```bash
HUGGINGFACE_API_KEY=hf_your_api_key_here
```

### Replace `hf_your_api_key_here` with your actual key from Step 1

Should look like:
```bash
HUGGINGFACE_API_KEY=hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### Save the file

That's it! The app is now configured.

---

## Step 3: Run the App (2 minutes)

### Open your terminal in this folder and run:

```bash
# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

### Open your browser:

Go to: **[http://localhost:3000](http://localhost:3000)**

---

## 🎉 You're Live!

### Try it out:

1. **Enter a business name**
   - Example: "TechVision Solutions"

2. **Describe your business**
   - Example: "An innovative AI-powered software platform that helps businesses automate their workflows and increase productivity"

3. **Select industry**
   - Example: "Technology"

4. **Click "Generate Brand Kit"**
   - Wait 10-30 seconds (first time takes longer)
   - AI is creating your logo, colors, fonts, and tagline!

5. **Download your brand kit**
   - Click the "Download Kit" button
   - Get a ZIP file with:
     - ✅ Logo (PNG)
     - ✅ Colors (hex codes)
     - ✅ Fonts (Google Fonts links)
     - ✅ Tagline
     - ✅ HTML preview

---

## 🐛 Having Issues?

### "Failed to generate logo"
**Solution**: Check your `.env.local` file
- Make sure your API key starts with `hf_`
- No extra spaces before or after the key
- Restart the dev server: Press `Ctrl+C`, then `npm run dev` again

### "Module not found" errors
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
npm install
```

### Still not working?
**Check**:
1. Node version: `node --version` (need 18+ or 20+)
2. Internet connection (AI APIs need internet)
3. `.env.local` file exists and has your key

---

## 📚 What's Next?

### Want to learn more?
- **Full Documentation**: `README.md`
- **Production Standards**: `claude.md`
- **Project Overview**: `PROJECT_SUMMARY.md`

### Want to deploy?
```bash
# Install Vercel
npm i -g vercel

# Deploy
vercel

# Add HUGGINGFACE_API_KEY in Vercel dashboard
```

### Want to customize?
- Edit `app/page.tsx` for the form
- Edit `tailwind.config.ts` for colors
- Edit `lib/api/fonts.ts` for font pairings

---

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build

# Code Quality
npm run lint             # Check code quality
npm run type-check       # Check TypeScript types
npm run format           # Format code

# Testing (when you add tests)
npm test                 # Run unit tests
npm run e2e              # Run E2E tests
```

---

## ✅ Success Checklist

- [ ] Got Hugging Face API key
- [ ] Added key to `.env.local`
- [ ] Ran `npm install`
- [ ] Ran `npm run dev`
- [ ] Opened [http://localhost:3000](http://localhost:3000)
- [ ] Generated first brand kit
- [ ] Downloaded the ZIP file
- [ ] Checked the HTML preview

---

## 🚀 You're Ready!

**Your production-ready AI brand kit generator is running!**

Share it with friends, deploy it, or customize it further.

**Need help?** Check `QUICK_START.md` for more detailed instructions.

---

**Built with ❤️ using production standards from `claude.md`**
