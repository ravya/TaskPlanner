# 📱 TaskPlanner Mobile App - Complete Guide

**Everything you need to run the mobile app in one place!**

---

## 🎯 Quick Start (3 Steps)

### Step 1: Open Two Terminal Windows

You need 2 terminal windows:
- **Terminal 1**: Firebase Emulators (backend)
- **Terminal 2**: Mobile App (Expo)

### Step 2: Start Firebase Emulators

**Terminal 1** - Copy and paste:
```bash
cd /Users/preeti/Documents/TaskPlanner
npm start
```

Wait for this message:
```
✔  All emulators ready!
```

✅ **Leave this terminal window open!**

### Step 3: Start Mobile App

**Terminal 2** (press Cmd+N for new window) - Copy and paste:
```bash
cd /Users/preeti/Documents/TaskPlanner/mobile
npx expo start
```

Wait 30-60 seconds. You'll see a **QR CODE** appear!

---

## 📱 How to Run the App (Choose One)

Once you see the QR code in Terminal 2, choose ONE option:

### Option A: Your Phone (Easiest!) ⭐ RECOMMENDED

**Setup (one time):**
1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Make sure phone and Mac are on **same WiFi**

**To run:**
1. **iPhone**: Open Camera app → Point at QR code → Tap notification
2. **Android**: Open Expo Go app → Tap "Scan QR" → Point at QR code

App loads in ~20 seconds!

### Option B: iOS Simulator (Mac Only)

**Setup (one time):**
```bash
sudo xcodebuild -license
# Press Space to scroll, type 'agree', enter password
```

**To run:**
In Terminal 2, press **`i`** → Simulator opens automatically!

### Option C: Web Browser (Quick Test)

In Terminal 2, press **`w`** → Opens in browser

⚠️ Note: Some features don't work in web (native pickers, etc.)

---

## ✅ Test the App

Once loaded:

1. **Register**:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Name: `Test User`

2. **Create a Task**:
   - Go to Tasks tab
   - Click "Add New Task"
   - Fill in details
   - Click "Create Task"

3. **View Dashboard**:
   - Go to Home tab
   - See task statistics
   - Toggle task completion

🎉 **You're done!**

---

## 🔧 Troubleshooting

### Problem: "I don't see a QR code"

**Wait longer** (up to 60 seconds). If still nothing:

```bash
# In Terminal 2, press Ctrl+C, then:
npx expo start -c
```

The `-c` clears the cache.

### Problem: "Port already in use"

```bash
# Kill all processes
lsof -ti:8081,9099,8080,4000 | xargs kill -9

# Start again
# Terminal 1: cd /Users/preeti/Documents/TaskPlanner && npm start
# Terminal 2: cd /Users/preeti/Documents/TaskPlanner/mobile && npx expo start
```

### Problem: "Couldn't connect to development server"

Make sure:
- Phone and Mac are on **same WiFi network**
- Firebase emulators are running (Terminal 1)
- You waited for QR code to appear

**OR** try entering URL manually:
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Copy the `exp://` URL from Terminal 2
4. Paste and connect

### Problem: "xcrun is not configured correctly"

You need to accept Xcode license:
```bash
sudo xcodebuild -license
```

Press Space, type `agree`, enter password.

### Problem: Expo won't start

```bash
cd /Users/preeti/Documents/TaskPlanner/mobile
rm -rf node_modules
npm install
npx expo start -c
```

---

## 🛑 How to Stop Everything

When you're done:

1. **Terminal 1**: Press **Ctrl+C** to stop Firebase
2. **Terminal 2**: Press **Ctrl+C** to stop Expo

OR kill all at once:
```bash
lsof -ti:8081,9099,8080,4000,5001 | xargs kill -9
```

---

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── tasks/TaskForm.tsx        # Task form component
│   ├── hooks/
│   │   └── useAuth.ts                # Auth hook
│   ├── navigation/
│   │   └── AppNavigator.tsx          # Navigation
│   ├── screens/
│   │   ├── LoginScreen.tsx           # Login
│   │   ├── RegisterScreen.tsx        # Register
│   │   ├── DashboardScreen.tsx       # Home/Stats
│   │   └── TasksScreen.tsx           # Tasks list
│   ├── services/
│   │   ├── firebase.ts               # Firebase config
│   │   ├── authService.ts            # Auth operations
│   │   └── taskService.ts            # Task CRUD
│   └── types/
│       ├── Task.ts                   # Task types
│       └── User.ts                   # User types
├── App.tsx                            # Root component
└── package.json                       # Dependencies
```

---

## 🎨 Customization

### Change App Name

Edit `mobile/app.json`:
```json
{
  "expo": {
    "name": "Your App Name"
  }
}
```

### Change Colors

Edit any screen file (e.g., `src/screens/DashboardScreen.tsx`):
```typescript
backgroundColor: '#3b82f6'  // Change to your color
```

### Add Features

1. Create new screen in `src/screens/`
2. Add route in `src/navigation/AppNavigator.tsx`
3. Add navigation button/tab

---

## 🚀 Deployment

### Build for App Stores

**Install EAS CLI:**
```bash
npm install -g eas-cli
eas login
```

**Configure:**
```bash
cd /Users/preeti/Documents/TaskPlanner/mobile
eas build:configure
```

**Build:**
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

**Submit:**
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

---

## 📊 What You Have

✅ **Authentication**
- Email/password login
- User registration
- Auto-login
- Session persistence

✅ **Dashboard**
- Task statistics (3 cards)
- Today's tasks list
- Completion percentage
- Quick task toggle

✅ **Tasks**
- Create, edit, delete
- Complete/uncomplete
- Priority levels (Low/Medium/High)
- Tags
- Date/time scheduling
- Repeating tasks (Daily/Weekly/Monthly)

✅ **Technical**
- Cross-platform (iOS & Android)
- Firebase integration
- Emulator support
- Type-safe (TypeScript)
- Well-documented

---

## 🔒 Production Setup

Before deploying to production:

1. **Update Firebase Config**

Edit `mobile/src/services/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_PRODUCTION_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

2. **Remove Emulator Code**

Comment out or remove:
```typescript
if (USE_EMULATORS) {
  // connectAuthEmulator(auth, ...);
  // connectFirestoreEmulator(db, ...);
}
```

3. **Update Security Rules**

Make sure your Firestore rules are production-ready.

---

## 📚 Additional Resources

- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Firebase Docs**: https://firebase.google.com/docs
- **React Native**: https://reactnative.dev

---

## 🆘 Still Having Issues?

### Full Reset

```bash
# Stop everything
lsof -ti:8081,9099,8080,4000,5001 | xargs kill -9

# Clean mobile app
cd /Users/preeti/Documents/TaskPlanner/mobile
rm -rf node_modules
npm install

# Restart
# Terminal 1: Firebase
cd /Users/preeti/Documents/TaskPlanner
npm start

# Terminal 2: Mobile
cd /Users/preeti/Documents/TaskPlanner/mobile
npx expo start -c
```

### Common Commands

```bash
# Kill all processes
lsof -ti:8081,9099,8080,4000,5001 | xargs kill -9

# Start Firebase
cd /Users/preeti/Documents/TaskPlanner && npm start

# Start Expo (clean)
cd /Users/preeti/Documents/TaskPlanner/mobile && npx expo start -c

# Start Expo (normal)
cd /Users/preeti/Documents/TaskPlanner/mobile && npx expo start

# Reinstall dependencies
cd /Users/preeti/Documents/TaskPlanner/mobile && rm -rf node_modules && npm install
```

---

## ✨ Quick Reference Card

| Task | Command |
|------|---------|
| Start Firebase | `cd /Users/preeti/Documents/TaskPlanner && npm start` |
| Start Mobile | `cd /Users/preeti/Documents/TaskPlanner/mobile && npx expo start` |
| Open iOS Simulator | Press `i` in Expo terminal |
| Open Android | Press `a` in Expo terminal |
| Open Web | Press `w` in Expo terminal |
| Reload App | Press `r` in Expo terminal |
| Stop All | `lsof -ti:8081,9099,8080,4000 \| xargs kill -9` |
| Clean Start | Add `-c` flag: `npx expo start -c` |

---

## 🎉 You're All Set!

Your mobile app is complete and ready to use:

✅ Full source code
✅ Complete documentation
✅ Firebase integration
✅ Cross-platform support
✅ Production-ready

**Next steps:**
1. Test the app
2. Customize branding
3. Add more features
4. Deploy to stores

**Happy coding! 🚀📱**
