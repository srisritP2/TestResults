# Cloudflare Pages Deployment Guide
## Complete Step-by-Step Guide for Cucumber Report Viewer

---

## 🎯 What You'll Get

- **Free hosting** with unlimited bandwidth
- **Auto-deployment** on every GitHub push
- **Fast global CDN** for worldwide access
- **Free domain**: `your-project-name.pages.dev`
- **Free SSL certificate** (HTTPS)

---

## 📋 Prerequisites

✅ GitHub account with your repository  
✅ Repository can be private or public  
✅ Your Vue.js app ready to deploy  

---

## 🚀 Step 1: Create Cloudflare Account

1. Go to: https://dash.cloudflare.com/sign-up
2. Sign up with your email (no credit card needed)
3. Verify your email address
4. Log in to Cloudflare Dashboard

---

## 🔗 Step 2: Connect to GitHub

1. In Cloudflare Dashboard, click **"Workers & Pages"** in the left sidebar
2. Click **"Create application"** button
3. Click **"Pages"** tab
4. Click **"Connect to Git"**
5. Click **"Connect GitHub"** button
6. Authorize Cloudflare to access your GitHub account
7. Choose repository access:
   - **Option A**: Select "All repositories" (easier)
   - **Option B**: Select "Only select repositories" and choose your repo

---

## ⚙️ Step 3: Configure Your Project

### 3.1 Select Repository
- Find and select your repository: `cucumber-report-viewer`
- Click **"Begin setup"**

### 3.2 Project Settings

Fill in these details:

**Project name:**
```
cucumber-report-viewer
```
(This becomes your URL: `cucumber-report-viewer.pages.dev`)

**Production branch:**
```
main
```
(Or `master` if that's your default branch)

### 3.3 Build Settings

**IMPORTANT**: Use these exact settings for your Vue.js app:

**Framework preset:**
```
Vue
```
(Select from dropdown)

**Build command:**
```
cd cucumber-report-viewer && npm install --legacy-peer-deps && npm run build
```

**Build output directory:**
```
cucumber-report-viewer/dist
```

**Root directory (advanced):**
```
/
```
(Leave as root since your app is in a subfolder)

---

## 🔧 Step 4: Environment Variables (Optional)

If your app uses environment variables:

1. Click **"Add environment variable"**
2. Add any variables from your `.env` file
3. Example:
   - Variable name: `VUE_APP_API_URL`
   - Value: `your-value-here`

**For this project**: You likely don't need any environment variables.

---

## 🎬 Step 5: Deploy!

1. Click **"Save and Deploy"** button
2. Cloudflare will:
   - Clone your repository
   - Install dependencies
   - Build your Vue app
   - Deploy to their global CDN
3. Wait 2-5 minutes for first deployment

---

## ✅ Step 6: Verify Deployment

### Check Build Status
- You'll see a build log in real-time
- Look for: ✅ **"Success: Your site is live!"**

### Get Your URL
- Your site will be live at: `https://cucumber-report-viewer.pages.dev`
- Click the URL to test your site

### Test Your App
- Navigate through your report viewer
- Upload a test report
- Verify all features work

---

## 🔄 How to Update Your Site

**It's automatic!** Every time you push to GitHub:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update report viewer"
   git push origin main
   ```
3. Cloudflare automatically detects the push
4. Builds and deploys your changes
5. Your site updates in 2-3 minutes

---

## 📊 Monitoring Your Deployments

### View Deployment History
1. Go to Cloudflare Dashboard
2. Click **"Workers & Pages"**
3. Click your project name
4. See all deployments with:
   - Build status (success/failed)
   - Deployment time
   - Git commit message
   - Preview URLs

### Check Build Logs
- Click any deployment to see detailed logs
- Useful for debugging build failures

---

## 🛠️ Troubleshooting

### Build Fails with "Command not found"

**Problem**: Build command can't find npm or node

**Solution**: Cloudflare uses Node.js 16 by default. To specify version:
1. Go to project settings
2. Add environment variable:
   - Name: `NODE_VERSION`
   - Value: `18` (or your preferred version)

### Build Fails with "Module not found"

**Problem**: Missing dependencies

**Solution**: Ensure `package.json` is in `cucumber-report-viewer/` folder

### Site Shows 404 Error

**Problem**: Wrong build output directory

**Solution**: Verify build output directory is set to:
```
cucumber-report-viewer/dist
```

### Routing Issues (Page Refresh Shows 404)

**Problem**: Vue Router in history mode needs configuration

**Solution**: Create `cucumber-report-viewer/public/_redirects` file:
```
/*    /index.html   200
```

---

## 🎨 Custom Domain (Optional)

Want to use your own domain instead of `.pages.dev`?

### If You Own a Domain:

1. Go to your project in Cloudflare
2. Click **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter your domain: `reports.yourcompany.com`
5. Follow DNS configuration instructions
6. Wait for DNS propagation (5-30 minutes)

**Cost**: FREE (no additional charges)

---

## 🔒 Security & Privacy

### Your Repository
- ✅ Can stay **private** on GitHub
- ✅ Only Cloudflare build system can access it
- ✅ Source code never exposed publicly

### Your Website
- ✅ Deployed site is **public** (anyone with URL can access)
- ✅ Free SSL certificate (HTTPS)
- ✅ DDoS protection included

### Access Control
If you need to restrict access to your reports:
- Use Cloudflare Access (paid feature)
- Or implement authentication in your Vue app

---

## 📈 Performance Tips

### Optimize Build Time
Your current build command is fine, but if builds are slow:
```bash
cd cucumber-report-viewer && npm ci && npm run build
```
(`npm ci` is faster than `npm install`)

### Reduce Bundle Size
Already optimized with Vue CLI production build

### Cache Busting
Cloudflare automatically handles cache invalidation on new deployments

---

## 🆚 Cloudflare vs GitHub Pages

### What's Different:

| Feature | Cloudflare Pages | GitHub Pages |
|---------|------------------|--------------|
| **Deployment** | Automatic on push | Automatic on push |
| **Build Process** | On Cloudflare servers | GitHub Actions |
| **URL Format** | `name.pages.dev` | `username.github.io/repo` |
| **Bandwidth** | Unlimited | Soft limit 100GB/month |
| **Speed** | Faster (better CDN) | Good |
| **Configuration** | Web dashboard | YAML file |

### Migration Benefits:
- ✅ Better performance
- ✅ No bandwidth worries
- ✅ Simpler configuration
- ✅ More reliable uptime

---

## 📞 Support & Resources

### Cloudflare Documentation
- Pages Docs: https://developers.cloudflare.com/pages/
- Vue.js Guide: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vue-site/

### Common Issues
- Build fails: Check build command and output directory
- 404 errors: Add `_redirects` file for SPA routing
- Slow builds: Use `npm ci` instead of `npm install`

### Get Help
- Cloudflare Community: https://community.cloudflare.com/
- Cloudflare Discord: https://discord.cloudflare.com/

---

## ✨ Quick Reference

### Your Build Configuration
```
Framework: Vue
Build command: cd cucumber-report-viewer && npm install && npm run build
Build output: cucumber-report-viewer/dist
Root directory: /
Node version: 18 (or latest)
```

### Your URLs
- **Production**: `https://cucumber-report-viewer.pages.dev`
- **Dashboard**: https://dash.cloudflare.com/

### Update Workflow
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Cloudflare auto-deploys in 2-3 minutes
```

---

## 🎉 You're All Set!

Your Cucumber Report Viewer is now:
- ✅ Deployed on Cloudflare's global CDN
- ✅ Auto-updating on every GitHub push
- ✅ Accessible worldwide with fast loading
- ✅ Secured with free SSL certificate
- ✅ Backed by unlimited bandwidth

**Next Steps:**
1. Share your URL with your team
2. Upload test reports via GitHub
3. Monitor deployments in Cloudflare Dashboard

---

## 🔄 Switching from GitHub Pages

If you're currently using GitHub Pages:

### Keep Both (Recommended During Testing)
- Keep GitHub Pages running
- Deploy to Cloudflare Pages
- Test Cloudflare version
- Switch when ready

### Disable GitHub Pages
1. Go to your GitHub repository
2. Settings → Pages
3. Source: Select "None"
4. Save

### Update Documentation
- Update README with new Cloudflare URL
- Update any links pointing to old GitHub Pages URL

---

**Need help?** Just ask! I'm here to assist with any deployment issues.
