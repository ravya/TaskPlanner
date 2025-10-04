# 🔥 Firebase Configuration Guide

## ✅ Already Done for Local Testing!

I've created `.env.local` with demo values that work with Firebase Emulators. **You can start testing immediately without a real Firebase project!**

---

## 🚀 Quick Start (Using Emulators)

### You're ready to go! Just start the app:

```bash
# Terminal 1 - Start Firebase Emulators
cd /Users/preeti/Documents/TaskPlanner
npm start

# Terminal 2 - Start Web App
cd /Users/preeti/Documents/TaskPlanner/web
npm run dev
```

**Your app will use:**
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Emulator UI: http://localhost:4000

**No real Firebase project needed for development!** ✨

---

## 🌐 For Production Setup (Optional)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `taskflow-production` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Get Firebase Configuration

1. In Firebase Console, click ⚙️ (Settings) → Project Settings
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Register app with nickname: `TaskFlow Web`
5. Copy the `firebaseConfig` object

### Step 3: Create Production Environment File

Create `.env.production` in `/web` directory:

```bash
cd /Users/preeti/Documents/TaskPlanner/web
nano .env.production
```

Paste your real Firebase credentials:

```env
# Production Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Disable emulators in production
VITE_USE_EMULATORS=false
```

### Step 4: Enable Firebase Services

In Firebase Console, enable:

1. **Authentication**
   - Go to Build → Authentication
   - Click "Get Started"
   - Enable "Email/Password"
   - Enable "Google" (optional)

2. **Firestore Database**
   - Go to Build → Firestore Database
   - Click "Create Database"
   - Start in "Production Mode"
   - Choose location (us-central1 recommended)

3. **Cloud Functions** (if using)
   - Go to Build → Functions
   - Upgrade to Blaze plan (pay-as-you-go)

4. **Cloud Messaging** (for notifications)
   - Go to Build → Cloud Messaging
   - Generate web credentials

### Step 5: Deploy Security Rules

```bash
cd /Users/preeti/Documents/TaskPlanner

# Update .firebaserc with your project ID
# Replace "taskflow-mvp" with your actual project ID

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

## 📁 Environment Files Explained

### `.env.local` (Already Created) ✅
- Used for **local development**
- Uses Firebase Emulators
- Demo values, no real project needed
- Git ignored (safe)

### `.env.example` (Already Created) ✅
- Template for other developers
- Shows what variables are needed
- Committed to git (no secrets)

### `.env.production` (Create when needed)
- Used for **production builds**
- Real Firebase credentials
- Git ignored (safe)
- Only needed when deploying

### `.env.development` (Optional)
- Alternative to `.env.local`
- Same as `.env.local`

---

## 🔒 Security Best Practices

### ✅ Git Configuration

Your `.gitignore` should include:
```
.env.local
.env.production
.env.development
.env
```

The `.env.example` is committed (no secrets).

### ✅ Firebase Security Rules

Already configured in `/db/rules/firestore.rules`:
- Users can only access their own data
- Authentication required for all operations
- Input validation at database level

### ✅ API Key Restrictions (Production)

In Firebase Console → Credentials:
1. Select your API key
2. Click "Application restrictions"
3. Select "HTTP referrers"
4. Add your domain: `https://yourdomain.com/*`
5. Save

---

## 🧪 Testing Different Configurations

### Local Development (Emulators)
```bash
# Uses .env.local automatically
npm run dev
```

### Production Build Locally
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Deploy to Firebase Hosting
```bash
# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## 🔍 Verify Configuration

### Check Environment Variables

```bash
# In web directory
cd /Users/preeti/Documents/TaskPlanner/web

# Check loaded variables
npm run dev

# In browser console (F12):
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID)
```

Should show: `demo-taskflow` (for local) or your project ID (for production)

### Check Firebase Connection

In browser console:
```javascript
// Check if Firebase is initialized
console.log(firebase.apps.length > 0)  // Should be true

// Check project ID
console.log(firebase.app().options.projectId)  // Shows your project ID
```

---

## 🐛 Troubleshooting

### Issue: "Firebase not initialized"

**Solution 1:** Check `.env.local` exists
```bash
ls -la /Users/preeti/Documents/TaskPlanner/web/.env.local
```

**Solution 2:** Restart dev server
```bash
# Kill server (Ctrl+C)
npm run dev
```

### Issue: "Permission denied" errors

**Cause:** Using production Firebase without proper rules

**Solution:**
1. Check if emulators are running: http://localhost:4000
2. Verify `.env.local` has `VITE_USE_EMULATORS=true`
3. Deploy security rules to production Firebase

### Issue: Environment variables are `undefined`

**Cause:** Variables must start with `VITE_` for Vite

**Solution:** All variables start with `VITE_` prefix ✅

### Issue: Changes to `.env` not reflected

**Solution:** Restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 📊 Current Configuration Status

### ✅ Completed:
- [x] `.env.local` created with demo values
- [x] `.env.example` created as template
- [x] Firebase config uses environment variables
- [x] Emulator connection configured
- [x] Security rules in place

### 🔄 Optional (For Production):
- [ ] Create real Firebase project
- [ ] Get production credentials
- [ ] Create `.env.production` file
- [ ] Deploy security rules
- [ ] Configure API key restrictions
- [ ] Enable Firebase services

### 📅 When to Set Up Production:
- When ready to deploy
- When testing with real users
- When need persistent data
- When need production features

---

## 🎯 Summary

### For Testing (RIGHT NOW):
✅ **You're all set!** Use `.env.local` with emulators
```bash
npm start  # Terminal 1
npm run dev  # Terminal 2
```

### For Production (LATER):
📝 Follow "For Production Setup" section when ready to deploy

---

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Emulators Documentation](https://firebase.google.com/docs/emulator-suite)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

## 🔑 Quick Reference

### Environment Variables:
```
VITE_FIREBASE_API_KEY              - Firebase API key
VITE_FIREBASE_AUTH_DOMAIN          - Auth domain
VITE_FIREBASE_PROJECT_ID           - Project ID
VITE_FIREBASE_STORAGE_BUCKET       - Storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID  - Sender ID
VITE_FIREBASE_APP_ID               - App ID
VITE_FIREBASE_MEASUREMENT_ID       - Analytics ID (optional)
VITE_USE_EMULATORS                 - true/false
```

### Files:
```
.env.local       - Local development (emulators) ✅
.env.example     - Template for developers ✅
.env.production  - Production credentials (create later)
```

### Commands:
```bash
npm run dev      - Start with .env.local
npm run build    - Build for production
npm run preview  - Preview production build
```

---

**You're ready to start testing!** 🎉

No Firebase project setup needed - just use the emulators!
