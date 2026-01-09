# TaskPlanner - Setup & Startup Guide

> Complete guide for setting up and running the TaskPlanner application.

## 📍 Quick Reference

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Emulator UI | http://127.0.0.1:4000 |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |

---

## 🚀 Starting the Application

### Option 1: Start Everything (Recommended)

**Terminal 1 - Firebase Emulators:**
```bash
cd /Users/preeti/Documents/TaskPlanner
npm start
```
Wait for: `✔ All emulators ready!`

**Terminal 2 - Web Dev Server:**
```bash
cd /Users/preeti/Documents/TaskPlanner/web
npm run dev
```
Wait for: `➜ Local: http://localhost:3000/`

### Option 2: Manual Start
```bash
# Emulators
firebase emulators:start

# Web app (separate terminal)
cd web && npm run dev
```

---

## 🌐 Browser Access

### Expected Behavior
- Opening http://localhost:3000 redirects to login
- "Running in emulator mode" message is normal
- Navigate directly to `/login` or `/register`

### Test Flow
1. Go to http://localhost:3000/register
2. Create account: `test@example.com` / `Test123!@#`
3. Should redirect to dashboard
4. Verify user in Emulator UI at http://127.0.0.1:4000/auth

---

## 🔧 Project Structure

```
TaskPlanner/
├── web/                    # React web application
├── mobile/                 # Expo mobile app
├── functions/              # Firebase Cloud Functions
├── db/                     # Database schema & rules
├── cypress/                # E2E tests
├── docs/                   # Documentation
├── firebase.json           # Firebase config
└── package.json            # Root package
```

---

## 📱 Mobile App (Expo)

```bash
cd mobile
npm start          # Start Expo dev server
npm run ios        # Run on iOS Simulator
npm run android    # Run on Android Emulator
```

---

## 🆘 Troubleshooting

### Port Conflicts
```bash
lsof -ti:3000,4000,5001,8080,9099 | xargs kill -9
```

### Emulator Issues
```bash
cd functions && npm run build && cd ..
rm -rf ~/.firebase
npm start
```

### Web Build Errors
```bash
cd web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Black Screen
1. Clear browser cache (Cmd+Shift+R)
2. Navigate directly to http://localhost:3000/login
3. Check console for errors (F12)

---

## ⚙️ Environment

The app uses `.env.local` for emulator configuration:
```
VITE_USE_EMULATORS=true
```

**Note:** Emulator data is stored locally and cleared on restart.
