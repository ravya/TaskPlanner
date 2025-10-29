# TaskPlanner Mobile App (React Native + Expo)

A cross-platform mobile app for task management built with React Native, Expo, and Firebase.

## 🚀 Features

- ✅ **Authentication**: Email/password login and registration
- 📊 **Dashboard**: View task statistics and today's tasks
- 📝 **Task Management**: Create, edit, delete, and complete tasks
- 🔄 **Repeating Tasks**: Support for daily, weekly, monthly recurring tasks
- 🏷️ **Tags & Priority**: Organize tasks with tags and priority levels
- 📅 **Date & Time**: Schedule tasks with date and optional time
- 🔥 **Firebase Integration**: Firestore database with emulator support
- 📱 **Cross-Platform**: Runs on both iOS and Android

## 📖 Quick Start

**For complete setup instructions, troubleshooting, and deployment guide, see:**
👉 **[MOBILE_APP_GUIDE.md](../MOBILE_APP_GUIDE.md)** in the project root

### TL;DR - 3 Steps:

1. **Start Firebase** (Terminal 1):
   ```bash
   cd /Users/preeti/Documents/TaskPlanner
   npm start
   ```

2. **Start Mobile App** (Terminal 2):
   ```bash
   cd /Users/preeti/Documents/TaskPlanner/mobile
   npx expo start
   ```

3. **Run on Device**:
   - **iPhone**: Scan QR code with Camera app
   - **iOS Simulator**: Press `i` in terminal
   - **Web**: Press `w` in terminal

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- For iOS: Xcode (Mac only) - accept license with `sudo xcodebuild -license`
- For Android: Android Studio
- Firebase Emulators (must be running for development)

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── tasks/
│   │       └── TaskForm.tsx       # Add/Edit task form
│   ├── hooks/
│   │   └── useAuth.ts            # Authentication hook
│   ├── navigation/
│   │   └── AppNavigator.tsx      # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.tsx       # Login screen
│   │   ├── RegisterScreen.tsx    # Registration screen
│   │   ├── DashboardScreen.tsx   # Home/Dashboard
│   │   └── TasksScreen.tsx       # Tasks list
│   ├── services/
│   │   ├── firebase.ts           # Firebase configuration
│   │   ├── authService.ts        # Auth service
│   │   └── taskService.ts        # Task CRUD service
│   └── types/
│       ├── Task.ts               # Task types
│       └── User.ts               # User types
├── App.tsx                        # Main app entry
├── package.json
└── README.md
```

## 🔥 Firebase Configuration

The app is configured to use Firebase Emulators in development mode (`__DEV__`).

### Emulator Configuration (Development)
- Auth Emulator: `http://127.0.0.1:9099`
- Firestore Emulator: `127.0.0.1:8080`

### For Production
Update `src/services/firebase.ts` with your Firebase project credentials:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## 📊 Data Model

### Task Interface
```typescript
{
  id: string;
  title: string;
  description: string;
  startDate: string;          // YYYY-MM-DD
  startTime?: string;          // HH:MM (optional)
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  isRepeating: boolean;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;      // YYYY-MM-DD
  userId: string;
  createdAt: Timestamp;
}
```

## 🎯 Key Features

### Authentication
- Email/password registration with display name
- Login with validation
- Auto-login on app start
- Secure logout

### Dashboard
- 3 stat cards: All Tasks, Task Progress, Today's Tasks
- Real-time task statistics
- Today's tasks list with quick complete toggle
- Pull to refresh

### Task Management
- Create tasks with title, description, date, time, priority
- Add tags (comma-separated)
- Set repeating tasks (daily/weekly/monthly with end date)
- Edit existing tasks
- Delete tasks with confirmation
- Toggle task completion with checkbox
- Visual priority badges (color-coded)

### Navigation
- Bottom tab navigation (Home, Tasks)
- Stack navigation for auth screens
- Auto-switch between auth and main app based on login state

## 🔧 Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run linter
- `npm test` - Run tests

## 📦 Dependencies

### Core
- React Native
- Expo
- TypeScript

### Firebase
- firebase
- @react-native-firebase/app
- @react-native-firebase/auth
- @react-native-firebase/firestore
- @react-native-async-storage/async-storage

### Navigation
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context

### UI Components
- @react-native-community/datetimepicker
- react-native-picker-select

## 🐛 Troubleshooting

### Firebase Emulator Connection Issues
1. Make sure Firebase emulators are running (`npm start` in project root)
2. Check that ports 9099 and 8080 are not blocked
3. For physical devices, update IP addresses in `firebase.ts`

### Metro Bundler Issues
```bash
# Clear cache and restart
npx expo start -c
```

### Build Issues
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🔐 Security Notes

- Firebase emulators are for development only
- Never commit real Firebase credentials
- Use Firestore security rules in production
- Implement proper authentication flow

## 🚀 Deployment

### iOS
1. Build with EAS: `eas build --platform ios`
2. Submit to App Store: `eas submit --platform ios`

### Android
1. Build with EAS: `eas build --platform android`
2. Submit to Play Store: `eas submit --platform android`

## 📝 License

MIT

## 👥 Support

For issues and questions:
- Check the main project README
- Review Firebase emulator logs
- Check Expo documentation: https://docs.expo.dev
