# Deployment Guide

This guide covers deploying the UTM Generator to various free hosting platforms.

## Table of Contents

1. [Render (Recommended)](#render-recommended)
2. [Vercel](#vercel)
3. [Netlify](#netlify)
4. [Cloudflare Pages](#cloudflare-pages)
5. [GitHub Pages](#github-pages)
6. [Common Issues](#common-issues)

---

## Render (Recommended)

Render is the recommended platform for this project because:
- ✅ 100% free for static sites
- ✅ Unlimited bandwidth on free tier
- ✅ Automatic deployment on every GitHub push
- ✅ Global CDN included
- ✅ Automatic HTTPS
- ✅ Custom domain support

### Step-by-Step Guide

#### 1. Prepare GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub at https://github.com/new
# Then push to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/utm-generator.git
git branch -M main
git push -u origin main
```

#### 2. Create Render Account

1. Visit https://render.com
2. Click "Sign up" (free account)
3. Sign up with GitHub (recommended for easier repo connection)
4. Authorize Render to access your GitHub account

#### 3. Create Static Site on Render

1. In Render dashboard, click "New +" → "Static Site"
2. Search for your `utm-generator` repository
3. Click "Connect"
4. Render will auto-detect settings from `render.yaml`:
   - **Name:** utm-generator
   - **Branch:** main
   - **Build Command:** npm install && npm run build
   - **Publish Directory:** dist

5. Click "Create Static Site"
6. Wait for deployment (usually 2-3 minutes)
7. Your site will be live at: `https://utm-generator-xxx.onrender.com`

#### 4. Verify Deployment

- ✅ Page loads without 404 errors
- ✅ Styling and icons display correctly
- ✅ Can generate UTM links
- ✅ Admin panel is accessible (click "Admin" button)
- ✅ LocalStorage works (data persists after refresh)

#### 5. (Optional) Add Custom Domain

1. In Render dashboard, go to "Settings"
2. Click "Add Custom Domain"
3. Enter your domain (e.g., utm-generator.yourdomain.com)
4. Follow Render's DNS instructions for your domain provider

---

## Vercel

### Step-by-Step Guide

#### 1. Push to GitHub (same as above)

#### 2. Create Vercel Account

1. Visit https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your GitHub account

#### 3. Deploy Project

1. In Vercel dashboard, click "Add New..." → "Project"
2. Search for and select `utm-generator`
3. Click "Import"
4. Vercel auto-detects Vite project settings:
   - **Framework Preset:** Vite
   - **Build Command:** npm run build
   - **Output Directory:** dist

5. Click "Deploy"
6. Wait for deployment (1-2 minutes)
7. Your site will be live at: `https://utm-generator-xxx.vercel.app`

#### 4. Auto-Deployment

- Every push to `main` branch triggers automatic deployment
- Preview deployments for pull requests

---

## Netlify

### Step-by-Step Guide

#### 1. Push to GitHub (same as above)

#### 2. Create Netlify Account

1. Visit https://netlify.com
2. Click "Sign up"
3. Sign up with GitHub
4. Authorize Netlify to access your GitHub account

#### 3. Deploy Project

1. In Netlify dashboard, click "Add new site" → "Import an existing project"
2. Click "GitHub"
3. Search for and select `utm-generator`
4. Configure build settings:
   - **Branch:** main
   - **Build command:** npm run build
   - **Publish directory:** dist

5. Click "Deploy site"
6. Wait for deployment
7. Your site will be live at: `https://utm-generator-xxx.netlify.app`

---

## Cloudflare Pages

### Step-by-Step Guide

#### 1. Push to GitHub (same as above)

#### 2. Create Cloudflare Account

1. Visit https://dash.cloudflare.com
2. Click "Sign up"
3. Create account and verify email

#### 3. Deploy Project

1. Go to "Pages" in left sidebar
2. Click "Create a project" → "Connect to Git"
3. Authorize Cloudflare to access GitHub
4. Select `utm-generator` repository
5. Configure build settings:
   - **Framework preset:** Vite
   - **Build command:** npm run build
   - **Build output directory:** dist

6. Click "Save and Deploy"
7. Wait for deployment
8. Your site will be live at: `https://utm-generator-xxx.pages.dev`

---

## GitHub Pages

GitHub Pages is the simplest but requires manual setup (no auto-deploy for free tier).

### Prerequisites

- Repository must be public
- GitHub account

### Step-by-Step Guide

#### 1. Update `vite.config.ts`

If deploying to `https://username.github.io/utm-generator`, update:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/utm-generator/', // Add this line
})
```

If deploying to `https://yourdomain.com`, no change needed.

#### 2. Build Locally

```bash
npm run build
```

#### 3. Deploy to `gh-pages` Branch

```bash
# Install gh-pages (one time)
npm install --save-dev gh-pages

# Add deploy scripts to package.json:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

#### 4. Configure GitHub Pages

1. Go to repository Settings → Pages
2. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** gh-pages
   - **Folder:** / (root)

3. Click "Save"
4. Your site will be live at: `https://username.github.io/utm-generator`

---

## Common Issues

### Issue: Page returns 404 error

**Cause:** Static files not found or wrong publish directory

**Solution:**
- Check that `npm run build` creates files in `dist/` folder
- Verify publish directory is set to `dist` (not `build` or `out`)
- Ensure `index.html` exists in `dist/` after build

### Issue: Styling/CSS not loading (broken styling)

**Cause:** Asset paths are incorrect

**Solution:**
- Verify Vite config has correct `base` path
- Check browser console for 404 errors on CSS/JS files
- Ensure build command runs successfully: `npm run build`

### Issue: Admin panel shows blank/broken

**Cause:** JavaScript not loaded or React failed to mount

**Solution:**
- Check browser console for JavaScript errors
- Verify `node_modules` was installed before build
- Try clearing browser cache and hard-refresh (Ctrl+Shift+R)
- Check that `dist/index.html` references correct JS bundle path

### Issue: LocalStorage not working

**Cause:** Usually browser security or private mode

**Solution:**
- Not a deployment issue - check if user is in private/incognito mode
- LocalStorage works in regular browsing mode
- Clear browser data and try again
- Test in different browser

### Issue: Admin password not working

**Cause:** Password is stored in browser localStorage

**Solution:**
- Default password is `admin123`
- If changed, check localStorage in browser DevTools (F12 → Application → Local Storage)
- Look for key `utm_generator_config`
- To reset: Go to DevTools → Application → Local Storage → Delete entry → Refresh

### Issue: Deploy fails with "node_modules not found" error

**Cause:** Dependencies not installed during build

**Solution for Render:**
- Ensure `render.yaml` has: `npm install && npm run build`
- Don't commit `node_modules` to git
- Ensure `package-lock.json` is committed

**Solution for other platforms:**
- Clear build cache and redeploy
- Verify `package.json` and `package-lock.json` are in repository root

---

## Post-Deployment Checklist

After deployment, verify everything works:

- [ ] Site loads without 404 errors
- [ ] Page title and favicon display correctly
- [ ] Dark theme renders properly
- [ ] All icons (Copy, Check) appear correctly
- [ ] Input fields are functional
- [ ] Generated UTM links are correct
- [ ] "Copy to clipboard" button works
- [ ] Admin button is visible in footer
- [ ] Admin panel is accessible
- [ ] Admin authentication works (try password `admin123`)
- [ ] Can change admin password
- [ ] Can add/remove UTM fields
- [ ] Can configure options
- [ ] Can set dependency rules
- [ ] Export configuration works (downloads JSON)
- [ ] Import configuration works
- [ ] Mobile responsive layout works
- [ ] Inspect console for JavaScript errors (should be none)

---

## Deployment Comparison

| Feature | Render | Vercel | Netlify | Cloudflare Pages | GitHub Pages |
|---------|--------|--------|---------|------------------|--------------|
| **Cost** | Free | Free | Free | Free | Free |
| **Auto-deploy** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Manual |
| **Bandwidth** | Unlimited | 100GB/mo | 100GB/mo | Unlimited | Unlimited |
| **CDN** | ✅ Global | ✅ Global | ✅ Global | ✅ Global | ✅ Global |
| **Custom domain** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **HTTPS** | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto |
| **Config file** | render.yaml | vercel.json | netlify.toml | wrangler.toml | N/A |
| **Free tier limits** | None | Fair Use | Fair Use | None | None |

---

## Environment Variables

This application **does NOT require any environment variables** because:
- No backend/API calls
- No secrets or API keys
- All configuration stored in browser localStorage
- Completely client-side

---

## Customization After Deployment

After deploying, you can customize:

### 1. Admin Password

1. Visit your deployed site
2. Click "Admin" button
3. Enter default password: `admin123`
4. Click "Change Password"
5. Enter new password (important for security!)

### 2. UTM Fields

1. In Admin Panel, click "Field Management"
2. Add custom fields specific to your tracking needs
3. Define which fields are dropdowns vs. text input
4. Configure dropdown options

### 3. Dependency Rules

1. In Admin Panel, click "Dependency Rules"
2. Set conditional relationships (e.g., "If source=Twitter, then platform can only be [Social]")
3. This helps enforce consistent tagging conventions

### 4. Export/Backup Configuration

1. In Admin Panel, click "Export Configuration"
2. Saves your configuration as JSON file
3. Keep this safe for backup or migrating to new instance

---

## Troubleshooting Deployment Failures

### For Render:

Check deployment logs:
1. Go to Render dashboard
2. Select your static site
3. Click "Logs" tab
4. Look for error messages

Common build failures:
- `npm: command not found` → Node.js not installed (check `.node-version`)
- `Build failed: tsc error` → TypeScript compilation error (check `src/` files)
- `Module not found` → Missing dependency (ensure `package.json` is correct)

### For Vercel/Netlify:

Check build logs in platform dashboard:
1. Go to project settings
2. Find "Deployments" or "Build logs"
3. Look for error messages

Check that:
- `npm run build` completes successfully locally
- No TypeScript errors: `npm run build` locally first
- Git repository is connected and latest code is pushed

---

## Performance Tips

After deployment, optimize performance:

1. **Browser caching:** Platforms auto-configure optimal cache headers
2. **Minification:** Vite auto-minifies in production build
3. **Code splitting:** Not needed for this small app, but Vite supports it
4. **Image optimization:** No heavy images in this app

---

## Support & Help

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages
- **Vite Docs:** https://vite.dev

---

## Summary

The easiest path to deployment:

1. **Ensure `render.yaml` exists** in project root ✅
2. **Push to GitHub** (all code and `render.yaml`)
3. **Create Render account** at https://render.com
4. **Connect repository** and deploy
5. **Test** all features at the live URL
6. **Change admin password** for security

That's it! Your app is now live and will auto-deploy with every GitHub push.
