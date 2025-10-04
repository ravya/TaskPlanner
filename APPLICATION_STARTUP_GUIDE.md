# TaskFlow Application - Startup Guide

## ✅ Setup Complete!

The application is now configured and ready for testing. Here's how to start and access it:

## 🚀 Starting the Application

### Option 1: Start Everything (Recommended)
From the project root directory:
```bash
# Start Firebase Emulators + Web App
npm start
```

This will start:
- **Firebase Auth Emulator**: http://127.0.0.1:9099
- **Firestore Emulator**: http://127.0.0.1:8080
- **Emulator UI**: http://127.0.0.1:4000
- **Firebase Functions**: http://127.0.0.1:5001

Then, in a separate terminal:
```bash
# Start Web Development Server
cd web && npm run dev
```

This will start:
- **Web Application**: http://localhost:3000

### Option 2: Start Manually (If you encounter port conflicts)

**Terminal 1 - Firebase Emulators:**
```bash
cd /Users/preeti/Documents/TaskPlanner
firebase emulators:start
```

**Terminal 2 - Web Dev Server:**
```bash
cd /Users/preeti/Documents/TaskPlanner/web
npm run dev
```

## 📍 Access Points

### Main Application
- **Web App**: http://localhost:3000
  - Login/Register pages
  - Dashboard
  - Task management

### Firebase Emulator UI
- **Emulator Dashboard**: http://127.0.0.1:4000
  - View Auth users
  - Browse Firestore data
  - Test Cloud Functions
  - Monitor logs

### Individual Emulators
- **Authentication**: http://127.0.0.1:9099
- **Firestore**: http://127.0.0.1:8080
- **Functions**: http://127.0.0.1:5001

## 🧪 Testing the Application

### Manual Testing (Recommended - Start Here!)
1. Open [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)
2. Follow the step-by-step testing scenarios
3. Use the Firebase Emulator UI to verify data

### Quick Testing Checklist
- See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for a printable checklist

### Unit Tests
```bash
# Run all tests
cd web && npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# View test UI
npm run test:ui
```

## 🔧 What Was Fixed

1. ✅ **Cloud Functions Build** - Fixed TypeScript compilation errors
2. ✅ **Missing Entry Files** - Created main.tsx, App.tsx, and page components
3. ✅ **Dependencies** - Removed missing devtools import
4. ✅ **Port Configuration** - Configured emulators with proper ports
5. ✅ **Firebase Config** - Set up environment variables for emulator use

## ⚠️ Known Issues

### Cloud Functions
- Functions emulator shows a module resolution warning (non-blocking)
- Firebase Admin SDK config fetch fails (expected in emulator mode)
- These warnings don't affect functionality

### Web Application
- Some components may need actual implementation (currently showing placeholders)
- Login/Register forms exist but may need Firebase config verification

## 🎯 Next Steps

1. **Start Testing**: Follow [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)
2. **Check Coverage**: Review [TEST_RESULTS.md](web/TEST_RESULTS.md)
3. **Run Unit Tests**: `cd web && npm test`
4. **Explore Features**: Use the emulator UI to understand data flow

## 📝 Important Notes

- **Emulator Data**: All data is stored locally and cleared when emulators restart
- **Environment**: The app is configured to use emulators by default (.env.local)
- **No Real Firebase**: No actual Firebase project needed for testing
- **Test Users**: Create test users through the registration form

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill processes on emulator ports
lsof -ti:4000,9099,8080,3000 | xargs kill -9
```

### Emulators Won't Start
```bash
# Rebuild functions
cd functions && npm run build && cd ..

# Clear emulator cache
rm -rf ~/.firebase
```

### Web App Build Errors
```bash
# Clean and reinstall
cd web
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [START_HERE.md](START_HERE.md) - Navigation hub
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) - Detailed testing guide
- [QUICK_START_TESTING.md](QUICK_START_TESTING.md) - 5-minute quick test
- [FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md) - Firebase configuration
- [web/TEST_RESULTS.md](web/TEST_RESULTS.md) - Unit test results

---

**🎉 You're all set! Start testing at http://localhost:3000**
