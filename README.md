# TaskPlanner

A cross-platform task management application with real-time synchronization, productivity tracking, and collaborative features. Built with React Native (Mobile) and React (Web), powered by Firebase.

---

## 📖 Overview

TaskPlanner is a modern productivity application designed to help individuals and teams organize their tasks efficiently. The app provides a seamless experience across web and mobile platforms with real-time synchronization, ensuring your tasks are always up-to-date regardless of the device you're using.

**Key Highlights:**
- 🌐 **Cross-Platform**: Available on Web, iOS, and Android
- ☁️ **Real-time Sync**: Changes sync instantly across all devices
- 📱 **Native Mobile Experience**: Built with React Native and Expo
- 🎯 **Productivity Focused**: Analytics, widgets, and smart organization
- 🔐 **Secure**: Firebase Authentication with Google OAuth support

---

## 🛠 Tech Stack

### Frontend

| Platform | Technology | Version |
|----------|-----------|---------|
| **Mobile** | React Native | 0.81.5 |
| | Expo | ~54.0 |
| | TypeScript | ~5.9.2 |
| | React Navigation | ^7.1.26 |
| **Web** | React | ^18.2.0 |
| | TypeScript | ^5.0.2 |
| | Vite | ^7.1.9 |
| | React Router | ^6.15.0 |

### Backend & Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Database** | Firebase Firestore | Real-time NoSQL database |
| **Authentication** | Firebase Auth | Email/password + Google OAuth |
| **Cloud Functions** | Firebase Functions | Background task processing |
| **Notifications** | Firebase Cloud Messaging | Push notifications |
| **Hosting** | Firebase Hosting | Static web app hosting |

### State Management & UI

| Category | Technology |
|----------|-----------|
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Animations** | Framer Motion |
| **Drag & Drop** | @dnd-kit |
| **Styling (Web)** | Tailwind CSS |
| **Styling (Mobile)** | React Native StyleSheet |
| **Date Handling** | date-fns |

### Development & Testing

| Category | Technology |
|----------|-----------|
| **Testing (Web)** | Vitest + Testing Library |
| **E2E Testing** | Cypress |
| **Linting** | ESLint + TypeScript ESLint |
| **Type Checking** | TypeScript |

---

## ✨ Features

### 1. Task Management
- ✅ Create, edit, and delete tasks
- ✅ Task title and description
- ✅ Set due date and time
- ✅ **New**: Set task deadlines for better planning
- ✅ Mark tasks as complete/incomplete
- ✅ Add subtasks to tasks
- ✅ Set reminders for tasks
- ✅ Recurring tasks (daily, weekly, monthly)
- ✅ Consolidated task toolbar for quick access to all options
- ✅ Drag & drop to reorder tasks and subtasks

### 2. Labels
- 🏷️ Create custom labels with colors
- 🏷️ Assign multiple labels to tasks
- 🏷️ Filter tasks by labels
- 🏷️ Bulk label operations

### 3. Projects
- 📁 Create and manage projects
- 📁 Assign tasks to projects
- 📁 Integrated project management in Sidebar
- 📁 View project progress
- 📁 Edit and delete projects
- 📁 Group tasks by project (including a "No Project" section)

### 4. Home/Work Mode
- 🏠 Toggle between Home and Work modes
- 🏠 View tasks for a selected mode or both modes together
- 🏠 Option to disable mode filtering in settings
- 🏠 Dropdown/toggle for quick mode switching

### 5. Navigation & Lists
- 🧭 Sidebar navigation for quick access to task lists
- 🧭 **Today's Tasks**: Quick overview of current tasks
- 🧭 **Weekly Tasks**: View tasks for the upcoming week
- 🧭 **Upcoming**: Future task planning
- 🧭 **Recurring**: Manage habit and repeating tasks
- 🧭 Bottom tab navigation for major app sections (Dashboard, Tasks, Analytics, Settings)

### 6. Search & Filter
- 🔍 Search tasks by text
- 🔍 Filter by labels
- 🔍 Filter by due date
- 🔍 Advanced filtering options

### 7. Dashboard & Analytics
- 📊 Today's tasks overview
- 📊 Task statistics cards
- 📊 Completion percentage
- 📊 Weekly completion trends
- 📊 Productivity tracking
- 📊 Visual charts and insights

### 8. Stickies Widget
- 📌 Visual sticky notes for today's tasks
- 📌 Group tasks by project
- 📌 Available on both web and mobile
- 📌 Quick task overview at a glance

### 9. Authentication
- 🔐 Email/password login
- 🔐 Google Sign-in
- 🔐 User registration
- 🔐 Auto-login with session persistence
- 🔐 Secure logout

### 10. Sync & Cloud
- ☁️ Real-time sync across devices
- ☁️ Cloud backup via Firebase
- ☁️ Offline support
- ☁️ Automatic conflict resolution

### 11. Notifications
- 🔔 Task reminders
- 🔔 Push notifications (mobile)
- 🔔 Notification settings toggle
- 🔔 Customizable notification preferences

### 12. Settings
- ⚙️ User preferences
- ⚙️ Sound toggles (mobile)
- ⚙️ Notification preferences
- ⚙️ Option to ignore modes
- ⚙️ Theme customization
- ⚙️ Enhanced labels management with vertical scrolling

---

## 📁 Project Structure

```
TaskPlanner/
├── web/                          # React web application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── common/          # Common components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── ui/              # UI elements
│   │   │   ├── AddProjectModal/ # Project creation
│   │   │   ├── ProjectList/     # Project listing
│   │   │   └── TodayStickiesWidget.tsx
│   │   ├── pages/               # Route pages
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── Tasks.tsx        # Task management
│   │   │   ├── Analytics.tsx    # Analytics view
│   │   │   ├── Login.tsx        # Login page
│   │   │   └── Register.tsx     # Registration page
│   │   ├── services/            # API services
│   │   │   └── firebase/        # Firebase integration
│   │   ├── store/               # Zustand state management
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   └── styles/              # Global styles
│   ├── public/                  # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                       # Expo mobile app
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   └── tasks/          # Task-related components
│   │   ├── screens/             # App screens
│   │   │   ├── auth/           # Auth screens
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── TasksScreen.tsx
│   │   │   ├── ProjectsScreen.tsx
│   │   │   ├── AnalyticsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── navigation/          # Navigation setup
│   │   │   ├── AppNavigator.tsx
│   │   │   └── Sidebar.tsx         # Custom drawer content
│   │   ├── services/            # Services
│   │   │   └── firebase/       # Firebase integration
│   │   ├── hooks/               # Custom hooks
│   │   ├── types/               # TypeScript types
│   │   └── styles/              # Shared styles
│   ├── assets/                  # Images, icons, fonts
│   ├── app.json                 # Expo configuration
│   └── package.json
│
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts
│   └── package.json
│
├── cypress/                      # E2E tests
│   ├── e2e/
│   └── support/
│
├── firebase.json                 # Firebase configuration
├── firestore.rules              # Firestore security rules
└── package.json                 # Root package.json
```

---

## 🚀 Development

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**: Comes with Node.js
- **Git**: For version control
- **Firebase CLI**: `npm install -g firebase-tools`
- **Expo CLI**: `npm install -g expo-cli` (optional, can use `npx`)

For iOS development (macOS only):
- **Xcode**: Latest version from App Store
- **iOS Simulator**: Included with Xcode

For Android development:
- **Android Studio**: ([Download](https://developer.android.com/studio))
- **Android SDK**: Installed via Android Studio

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskPlanner
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install web dependencies**
   ```bash
   cd web
   npm install
   cd ..
   ```

4. **Install mobile dependencies**
   ```bash
   cd mobile
   npm install
   cd ..
   ```

5. **Firebase Configuration**
   
   Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   
   **For Web:**
   - Create `web/.env.local`:
     ```env
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
     VITE_FIREBASE_APP_ID=1:123456789:web:abc123
     ```
   
   **For Mobile:**
   - Update `mobile/src/services/firebase/config.ts` with your Firebase config
   - Add `GoogleService-Info.plist` (iOS) to `mobile/`
   - Add `google-services.json` (Android) to `mobile/`

### Running Development Server

#### Option 1: Run Everything (Recommended for Development)

**Terminal 1: Firebase Emulators**
```bash
cd TaskPlanner
npm start
```
Wait for `✔ All emulators ready!` message. This starts:
- Firestore Emulator (port 8080)
- Auth Emulator (port 9099)
- Emulator UI (http://localhost:4000)

**Terminal 2: Web App**
```bash
cd TaskPlanner/web
npm run dev
```
Access at: http://localhost:3000

**Terminal 3: Mobile App**
```bash
cd TaskPlanner/mobile
npx expo start
```
or for tunnel mode (recommended for testing on physical devices):
```bash
npx expo start --tunnel
```

#### Option 2: Individual Services

**Web Only:**
```bash
# Terminal 1
cd TaskPlanner && npm start

# Terminal 2
cd TaskPlanner/web && npm run dev
```

**Mobile Only:**
```bash
# Terminal 1
cd TaskPlanner && npm start

# Terminal 2
cd TaskPlanner/mobile && npx expo start
```

### Running on Devices/Simulators

#### iOS Simulator (macOS only)

1. Start the mobile app (`npx expo start`)
2. Press `i` in the terminal
3. Simulator will launch automatically

Or manually:
```bash
cd mobile
npm run ios
```

#### Android Emulator

1. Start Android emulator from Android Studio
2. Start the mobile app (`npx expo start`)
3. Press `a` in the terminal

Or manually:
```bash
cd mobile
npm run android
```

#### Physical Device (Easiest!)

1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Ensure device and computer are on the same WiFi
3. Start the mobile app (`npx expo start --tunnel`)
4. **iOS**: Open Camera app → Scan QR code → Tap notification
5. **Android**: Open Expo Go → Scan QR code

### Building for Production

#### Web App

```bash
cd web
npm run build
```
Build output: `web/dist/`

Preview production build:
```bash
npm run preview
```

#### Mobile App

**Install EAS CLI:**
```bash
npm install -g eas-cli
eas login
```

**Configure (first time):**
```bash
cd mobile
eas build:configure
```

**Build iOS:**
```bash
eas build --platform ios
```

**Build Android:**
```bash
eas build --platform android
```

**Build both platforms:**
```bash
eas build --platform all
```

### Deployment

#### Web Deployment (Firebase Hosting)

```bash
# Build the web app
cd web
npm run build

# Deploy to Firebase
cd ..
firebase deploy --only hosting
```

#### Mobile Deployment (App Stores)

**iOS App Store:**
```bash
cd mobile
eas submit --platform ios
```

**Google Play Store:**
```bash
cd mobile
eas submit --platform android
```

### Testing

#### Unit Tests (Web)
```bash
cd web
npm test                  # Run tests
npm run test:ui          # Run with UI
```

#### E2E Tests (Cypress)
```bash
cd web
npm run test:e2e         # Interactive mode
npm run test:e2e:headless # Headless mode
```

#### Type Checking
```bash
# Web
cd web
npm run type-check

# Mobile
cd mobile
npx tsc --noEmit
```

#### Linting
```bash
cd web
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

---

## 📝 Implementation Notes

### Architecture Decisions

1. **Monorepo Structure**: The project uses a monorepo structure with separate `web/` and `mobile/` directories, sharing types and Firebase configuration where possible.

2. **State Management**: Zustand is used for lightweight, flexible state management without the boilerplate of Redux.

3. **Firebase Emulators**: Development uses Firebase emulators for faster iteration and offline development. Switch to production Firebase in `firebase/config.ts`.

4. **Real-time Sync**: Firestore's real-time listeners are used for instant synchronization across devices.

### Key Implementation Details

**Task Organization:**
- Tasks are stored in Firestore with user-scoped collections
- Each task document includes metadata for filtering and sorting
- Projects are separate documents with task references

**Mode System:**
- Tasks have a `mode` field (home/work)
- Settings allow users to toggle mode visibility
- Filter can show: Home only, Work only, or Both

**Labels System:**
- Labels are stored at the user level
- Tasks reference labels by ID
- Color-coded for visual organization

**Recurring Tasks:**
- Implemented using calendar events
- Firebase Cloud Functions handle recurring task creation
- Supports daily, weekly, and monthly recurrence

**Offline Support:**
- Firestore enables persistence by default
- AsyncStorage (mobile) caches user preferences
- Optimistic UI updates for better UX

**Authentication Flow:**
- Firebase Auth handles email/password and Google OAuth
- Session persists using AsyncStorage (mobile) and localStorage (web)
- Auth state synced via Firebase observers

### Performance Optimizations

- **Virtualization**: Large task lists use `react-window` for efficient rendering
- **Lazy Loading**: Routes are code-split using React lazy loading
- **Memoization**: React.memo and useMemo prevent unnecessary re-renders
- **Query Optimization**: Firestore queries use indexes and limits

### Security

- Firestore security rules enforce user-level data access
- Environment variables protect sensitive configuration
- Google OAuth provides secure third-party authentication

### Known Limitations

- File attachments not currently supported
- Task comments planned for future release
- Time tracking in development
- Calendar view under consideration

### Development Tips

1. **Port Conflicts**: If ports are in use, kill processes:
   ```bash
   lsof -ti:8081,9099,8080,4000,5001 | xargs kill -9
   ```

2. **Clear Cache**: If experiencing issues:
   ```bash
   # Mobile
   cd mobile && npx expo start -c
   
   # Web
   cd web && rm -rf node_modules/.vite
   ```

3. **Firebase Emulators**: Always start emulators before running apps locally

4. **Expo Go Limitations**: Some features (like custom native modules) won't work in Expo Go. Use development builds for full functionality.

---

## 📖 Additional Documentation

- [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md)
- [Mobile App Guide](MOBILE_APP_GUIDE.md)
- [Testing Guide](QUICK_START_TESTING.md)
- [Widget Usage](WIDGET_USAGE.md)

---

## 📄 License

MIT

---

**Built with ❤️ by the TaskPlanner Team**