# Deploy Static Website from Private GitHub Repository to Netlify

## 📋 Overview
This guide walks you through deploying a static website from a private GitHub repository to Netlify, keeping your code private while making the site publicly accessible.

## 🎯 What You'll Achieve
- Deploy from private GitHub repo to Netlify
- Keep repository private
- Get a free Netlify subdomain (e.g., `yoursite.netlify.app`)
- Optionally connect a custom free domain
- Set up automatic deployments from main branch

## 📚 Prerequisites
- GitHub account with a private repository containing your static website
- Netlify account (free)
- Static website files (HTML, CSS, JS, etc.)

---

## 🚀 Step 1: Prepare Your GitHub Repository

### 1.1 Repository Structure
Ensure your repository has this structure:
```
your-repo/
├── index.html          # Main entry point
├── css/
│   └── style.css
├── js/
│   └── script.js
├── images/
└── README.md
```

### 1.2 Build Configuration (if needed)
If your site requires building (React, Vue, etc.), add these files:

**package.json** (for Node.js projects):
```json
{
  "name": "my-static-site",
  "version": "1.0.0",
  "scripts": {
    "build": "npm run build-command",
    "start": "serve -s build"
  },
  "devDependencies": {
    "serve": "^14.0.0"
  }
}
```

**netlify.toml** (optional configuration):
```toml
[build]
  publish = "dist"  # or "build" or wherever your built files go
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🔗 Step 2: Connect Netlify to GitHub

### 2.1 Sign Up/Login to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up" or "Log in"
3. Choose "Sign up with GitHub" for easier integration

### 2.2 Authorize GitHub Access
1. Netlify will request GitHub permissions
2. Click "Authorize Netlify"
3. You may need to enter your GitHub password

---

## 📂 Step 3: Deploy Your Site

### 3.1 Create New Site
1. In Netlify dashboard, click "Add new site"
2. Select "Import an existing project"
3. Choose "Deploy with GitHub"

### 3.2 Repository Selection
1. **Grant Repository Access:**
   - Click "Configure Netlify on GitHub"
   - Select "Only select repositories"
   - Choose your private repository
   - Click "Install & Authorize"

2. **Select Repository:**
   - Back in Netlify, you'll see your private repo listed
   - Click on your repository name

### 3.3 Configure Deployment Settings
```
Branch to deploy: main
Build command: npm run build (or leave empty for static HTML)
Publish directory: dist (or build, or leave empty for root)
```

**Common Build Settings:**
- **Static HTML:** Leave build command empty, publish directory: `/` (root)
- **React:** Build command: `npm run build`, Publish directory: `build`
- **Vue:** Build command: `npm run build`, Publish directory: `dist`
- **Angular:** Build command: `npm run build`, Publish directory: `dist`

### 3.4 Deploy Site
1. Click "Deploy site"
2. Netlify will start building and deploying
3. Wait for deployment to complete (usually 1-3 minutes)

---

## 🌐 Step 4: Access Your Live Site

### 4.1 Get Your Netlify URL
1. After deployment, you'll get a random URL like: `https://amazing-curie-123456.netlify.app`
2. Click on the URL to view your live site

### 4.2 Customize Site Name
1. In site dashboard, click "Site settings"
2. Click "Change site name"
3. Enter your preferred name: `myawesomesite`
4. Your new URL: `https://myawesomesite.netlify.app`

---

## 🔄 Step 5: Automatic Deployments

### 5.1 Verify Auto-Deploy
- Any push to the `main` branch will trigger automatic deployment
- Check "Deploys" tab to see deployment history

### 5.2 Deploy Notifications (Optional)
1. Go to "Site settings" → "Build & deploy" → "Deploy notifications"
2. Add email, Slack, or webhook notifications

---

## 🏷️ Step 6: Custom Domain (Optional)

### Option A: Free Domain from Freenom

#### 6.1 Get Free Domain
1. Go to [freenom.com](https://freenom.com)
2. Search for available domains (.tk, .ml, .ga, .cf)
3. Register for free (up to 12 months)

#### 6.2 Configure DNS in Freenom
1. In Freenom dashboard, go to "My Domains"
2. Click "Manage Domain" → "Manage Freenom DNS"
3. Add these records:
```
Type: A
Name: @ (or leave empty)
Target: 75.2.60.5

Type: CNAME
Name: www
Target: yoursite.netlify.app
```

#### 6.3 Add Domain to Netlify
1. In Netlify, go to "Domain settings"
2. Click "Add custom domain"
3. Enter your Freenom domain: `yoursite.tk`
4. Click "Verify" → "Add domain"

### Option B: Free Domain from DuckDNS

#### 6.1 Get DuckDNS Domain
1. Go to [duckdns.org](https://duckdns.org)
2. Sign in with GitHub/Google
3. Create subdomain: `yoursite.duckdns.org`

#### 6.2 Configure DuckDNS
1. Set IP to Netlify's: `75.2.60.5`
2. Or use CNAME: `yoursite.netlify.app`

#### 6.3 Add to Netlify
1. Add custom domain in Netlify: `yoursite.duckdns.org`
2. Netlify will handle SSL automatically

---

## 🔒 Step 7: Security & SSL

### 7.1 HTTPS Certificate
- Netlify automatically provides free SSL certificates
- Your site will be accessible via HTTPS within minutes

### 7.2 Force HTTPS
1. Go to "Domain settings"
2. Enable "Force HTTPS redirect"

---

## 🛠️ Step 8: Advanced Configuration

### 8.1 Environment Variables
1. Go to "Site settings" → "Environment variables"
2. Add any needed variables for your build process

### 8.2 Build Hooks
1. Go to "Site settings" → "Build & deploy" → "Build hooks"
2. Create webhook URLs for external triggers

### 8.3 Form Handling (Bonus)
Add to your HTML for free form handling:
```html
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>
```

---

## 🎉 Step 9: Verification Checklist

- [ ] Repository is private on GitHub
- [ ] Site deploys successfully from main branch
- [ ] Site is accessible via Netlify URL
- [ ] Custom domain works (if configured)
- [ ] HTTPS is enabled
- [ ] Auto-deployment works on git push

---

## 🚨 Troubleshooting

### Common Issues:

**Build Fails:**
- Check build logs in Netlify dashboard
- Verify build command and publish directory
- Ensure all dependencies are in package.json

**Site Not Loading:**
- Check if index.html exists in publish directory
- Verify file paths are correct (case-sensitive)

**Custom Domain Not Working:**
- DNS changes can take 24-48 hours
- Use DNS checker tools to verify propagation
- Ensure DNS records point to correct Netlify IP

**Repository Not Visible:**
- Re-authorize Netlify GitHub app
- Check repository permissions in GitHub settings

---

## 📈 Next Steps

1. **Performance Optimization:**
   - Enable asset optimization in Netlify
   - Add image compression
   - Implement caching headers

2. **Monitoring:**
   - Set up analytics
   - Monitor site performance
   - Track deployment success rates

3. **Advanced Features:**
   - Add serverless functions
   - Implement A/B testing
   - Set up branch previews

---

## 🔗 Useful Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Pages vs Netlify Comparison](https://www.netlify.com/github-pages-vs-netlify/)
- [Free Domain Providers](https://www.freenom.com/)
- [DNS Propagation Checker](https://dnschecker.org/)

---

**🎯 Result:** Your private GitHub repository will deploy to a public Netlify site while keeping your source code private!