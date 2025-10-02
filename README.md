# TaskFlow Backend

Smart task management backend with deadlines, notifications, and progress tracking.

## Architecture

- **Database**: Firebase Firestore (NoSQL, real-time)
- **Authentication**: Firebase Auth (Email + Google OAuth)
- **Functions**: Node.js Cloud Functions
- **Notifications**: Firebase Cloud Messaging (FCM)

## Quick Start

```bash
# Install dependencies
npm run setup

# Start development server
npm start

# Deploy to Firebase
npm run deploy
```

## Project Structure

```
taskflow-backend/
├── db/                 # Database schemas, rules, indexes
├── functions/          # Cloud Functions (business logic)
├── client-sdk/         # Frontend integration SDK
└── docs/              # API documentation
```

## Development

1. **Setup Firebase CLI**: `npm install -g firebase-tools`
2. **Login to Firebase**: `firebase login`
3. **Start Emulator**: `npm start`
4. **Access Admin UI**: http://localhost:4000

## Features

- ✅ Task Management (CRUD operations)
- ✅ Tag System (filtering, usage tracking)
- ✅ Deadline Notifications (FCM integration)
- ✅ Progress Tracking (stats, overdue detection)
- ✅ Offline Support (client-side sync)
- ✅ Real-time Updates (Firestore listeners)

## API Documentation

See `docs/API.md` for complete endpoint documentation.