# TaskFlow - Manual Testing Guide

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Starting the Application](#starting-the-application)
3. [Testing Checklist](#testing-checklist)
4. [Feature-by-Feature Testing](#feature-by-feature-testing)
5. [Test Scenarios](#test-scenarios)
6. [Known Issues & Troubleshooting](#known-issues--troubleshooting)

---

## Initial Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account (for production testing)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Step 1: Install Dependencies

```bash
# Navigate to the project root
cd /Users/preeti/Documents/TaskPlanner

# Install root dependencies
npm install

# Install web dependencies
cd web
npm install

# Install functions dependencies
cd ../functions
npm install
```

### Step 2: Firebase Setup (if not already done)

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if needed)
firebase init

# Update Firebase configuration
# Edit web/src/services/firebase/config.ts with your Firebase credentials
```

---

## Starting the Application

### Option 1: Local Development with Firebase Emulators (Recommended)

```bash
# Terminal 1 - Start Firebase Emulators
cd /Users/preeti/Documents/TaskPlanner
npm start

# Wait for emulators to start, you should see:
# ✔  All emulators ready! View status at http://localhost:4000
```

```bash
# Terminal 2 - Start Web Frontend
cd /Users/preeti/Documents/TaskPlanner/web
npm run dev

# You should see:
# ➜  Local:   http://localhost:3000/
# ➜  Network: use --host to expose
```

**Access Points:**
- **Web App:** http://localhost:3000
- **Firebase Emulator UI:** http://localhost:4000
- **Firestore Emulator:** http://localhost:8080
- **Auth Emulator:** http://localhost:9099
- **Functions Emulator:** http://localhost:5001

### Option 2: Production Environment

```bash
# Deploy to Firebase
cd /Users/preeti/Documents/TaskPlanner
npm run deploy

# Access your app at:
# https://taskflow-mvp.web.app (or your custom domain)
```

---

## Testing Checklist

### ✅ Quick Health Check (5 minutes)

- [ ] Application loads without errors
- [ ] Login page is visible
- [ ] Registration form is accessible
- [ ] Firebase emulators are running (if using local)
- [ ] Console has no critical errors (F12 -> Console)

### ✅ Core Functionality (15 minutes)

- [ ] User can register
- [ ] User can login
- [ ] User can create a task
- [ ] User can view tasks
- [ ] User can edit a task
- [ ] User can delete a task
- [ ] User can logout

### ✅ Advanced Features (30 minutes)

- [ ] Task filtering works
- [ ] Task search works
- [ ] Tags can be created and assigned
- [ ] Task priorities can be set
- [ ] Due dates can be set
- [ ] Notifications appear (if configured)
- [ ] Offline mode works (disconnect network)

---

## Feature-by-Feature Testing

### 1. Authentication & User Management

#### Test Case 1.1: User Registration

**Steps:**
1. Open http://localhost:3000
2. Click "Register" or "Sign Up" link
3. Fill in the registration form:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Display Name: `Test User`
   - Confirm Password: `TestPassword123!`
4. Click "Register" or "Sign Up" button

**Expected Results:**
- ✅ User is registered successfully
- ✅ Redirected to dashboard
- ✅ Welcome message appears with user's name
- ✅ User data appears in Firebase Auth Emulator (http://localhost:4000)

**Test with Edge Cases:**
- [ ] Email without @ symbol → Should show error
- [ ] Password less than 8 characters → Should show error
- [ ] Passwords don't match → Should show error
- [ ] Already registered email → Should show "Email already in use"

#### Test Case 1.2: User Login

**Steps:**
1. Navigate to login page (or logout if already logged in)
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Click "Login" button

**Expected Results:**
- ✅ User is logged in successfully
- ✅ Redirected to dashboard
- ✅ User avatar/name appears in header
- ✅ Tasks are loaded (if any exist)

**Test with Edge Cases:**
- [ ] Wrong password → Should show "Invalid credentials" error
- [ ] Non-existent email → Should show "User not found" error
- [ ] Empty fields → Should show validation errors

#### Test Case 1.3: Google OAuth Login

**Steps:**
1. Click "Sign in with Google" button
2. Select Google account (or use test account)
3. Grant permissions

**Expected Results:**
- ✅ User is authenticated via Google
- ✅ Redirected to dashboard
- ✅ User profile populated with Google account info
- ✅ Google profile picture displayed

#### Test Case 1.4: Password Reset

**Steps:**
1. On login page, click "Forgot Password?"
2. Enter email: `test@example.com`
3. Click "Send Reset Email"
4. Check email (or check Emulator UI for email)

**Expected Results:**
- ✅ Success message: "Password reset email sent"
- ✅ Email appears in Auth Emulator logs
- ✅ Can click reset link and set new password

#### Test Case 1.5: Profile Management

**Steps:**
1. Login to the application
2. Navigate to Profile page (usually top-right menu → Profile)
3. Update display name to: `Updated User`
4. Upload profile picture (if supported)
5. Click "Save Changes"

**Expected Results:**
- ✅ Success message appears
- ✅ Name updates in header/navbar
- ✅ Profile picture updates (if uploaded)
- ✅ Changes persist after page refresh

#### Test Case 1.6: Logout

**Steps:**
1. Click user menu (top-right)
2. Click "Logout" or "Sign Out"

**Expected Results:**
- ✅ User is logged out
- ✅ Redirected to login page
- ✅ Cannot access protected routes without re-login
- ✅ Local storage cleared

---

### 2. Task Management

#### Test Case 2.1: Create New Task

**Steps:**
1. Login to the application
2. Click "Create Task" or "+" button
3. Fill in task details:
   - Title: `Complete project documentation`
   - Description: `Write comprehensive docs for the project`
   - Priority: `High`
   - Due Date: Tomorrow's date
   - Tags: `work`, `documentation`
4. Click "Create" or "Save"

**Expected Results:**
- ✅ Success message: "Task created successfully"
- ✅ Task appears in task list
- ✅ Task has correct title, description, priority
- ✅ Due date badge/indicator appears
- ✅ Tags are visible
- ✅ Task appears in Firestore Emulator (http://localhost:4000)

**Create Multiple Tasks:**
- [ ] Task 2: `Review pull requests` (Priority: Medium, No due date)
- [ ] Task 3: `Fix bug in authentication` (Priority: Critical, Due: Today)
- [ ] Task 4: `Team meeting notes` (Priority: Low, Tags: personal)
- [ ] Task 5: `Update dependencies` (Priority: Medium, Tags: maintenance)

#### Test Case 2.2: View Task List

**Steps:**
1. Navigate to Tasks page or Dashboard
2. Observe the task list

**Expected Results:**
- ✅ All created tasks are visible
- ✅ Tasks are sorted correctly (by date, priority, or status)
- ✅ Task cards/items show:
  - Title
  - Description (truncated if long)
  - Priority indicator (color/badge)
  - Due date
  - Tags
  - Status

#### Test Case 2.3: View Task Details

**Steps:**
1. Click on a task in the list
2. Task details modal/page opens

**Expected Results:**
- ✅ All task information displayed:
  - Title
  - Full description
  - Priority
  - Status
  - Due date
  - Tags
  - Created date
  - Updated date
  - Estimated time (if set)
  - Actual time (if tracked)

#### Test Case 2.4: Edit Task

**Steps:**
1. Click on a task or click "Edit" button
2. Modify task details:
   - Change title to: `Complete project documentation (Updated)`
   - Change priority to: `Medium`
   - Add new tag: `urgent`
3. Click "Save" or "Update"

**Expected Results:**
- ✅ Success message appears
- ✅ Task updates in the list
- ✅ Changes are visible immediately
- ✅ Updated timestamp changes
- ✅ Changes persist after page refresh

#### Test Case 2.5: Change Task Status

**Steps:**
1. Find a task with status "Todo"
2. Change status to "In Progress"
3. Change status to "Completed"

**Expected Results:**
- ✅ Status updates immediately
- ✅ Task moves to appropriate section (if using Kanban view)
- ✅ Completed tasks show completion timestamp
- ✅ Completed tasks may show differently (strikethrough, grayed out)

#### Test Case 2.6: Delete Task

**Steps:**
1. Click "Delete" icon/button on a task
2. Confirm deletion in confirmation dialog
3. Click "Yes" or "Confirm"

**Expected Results:**
- ✅ Confirmation modal appears
- ✅ Task is removed from list after confirmation
- ✅ Success message: "Task deleted successfully"
- ✅ Task is soft-deleted (isDeleted: true in database)
- ✅ Can't be recovered unless there's an "Undo" feature

**Cancel Deletion:**
- [ ] Click "Delete" then "Cancel" → Task should remain

#### Test Case 2.7: Bulk Operations

**Steps:**
1. Select multiple tasks (checkboxes)
2. Click "Mark as Completed" from bulk actions
3. Verify all selected tasks are completed

**Test Other Bulk Actions:**
- [ ] Bulk delete → All selected tasks deleted
- [ ] Bulk priority change → All tasks update priority
- [ ] Bulk tag addition → All tasks get new tag

---

### 3. Task Filtering & Search

#### Test Case 3.1: Filter by Status

**Steps:**
1. Click status filter dropdown
2. Select "Completed"

**Expected Results:**
- ✅ Only completed tasks are shown
- ✅ Other tasks are hidden
- ✅ Count/badge shows number of completed tasks

**Test all statuses:**
- [ ] Todo
- [ ] In Progress
- [ ] Completed
- [ ] All (shows everything)

#### Test Case 3.2: Filter by Priority

**Steps:**
1. Click priority filter
2. Select "High"

**Expected Results:**
- ✅ Only high priority tasks shown
- ✅ Filter badge/indicator appears
- ✅ Can clear filter to see all tasks

**Test all priorities:**
- [ ] Low
- [ ] Medium
- [ ] High
- [ ] Critical

#### Test Case 3.3: Search Tasks

**Steps:**
1. Type in search box: `documentation`
2. Wait for results (debounced search)

**Expected Results:**
- ✅ Tasks matching "documentation" appear
- ✅ Search is case-insensitive
- ✅ Searches in title and description
- ✅ Results update as you type
- ✅ Clear button appears in search box

**Test search variations:**
- [ ] Partial words: `doc` → finds "documentation"
- [ ] Multiple words: `project complete` → finds matching tasks
- [ ] Special characters: `bug #123` → finds tasks with that text
- [ ] No results: `xyzabc` → shows "No tasks found" message

#### Test Case 3.4: Filter by Tags

**Steps:**
1. Click tag filter or tag chip
2. Select "work" tag

**Expected Results:**
- ✅ Only tasks with "work" tag shown
- ✅ Can select multiple tags (AND or OR logic)
- ✅ Tag filter badge appears
- ✅ Can clear tag filter

#### Test Case 3.5: Combine Filters

**Steps:**
1. Set status filter: "In Progress"
2. Set priority filter: "High"
3. Add tag filter: "work"
4. Add search: "bug"

**Expected Results:**
- ✅ Only tasks matching ALL criteria are shown
- ✅ Filter badges show all active filters
- ✅ "Clear all filters" button appears
- ✅ Clearing filters shows all tasks again

---

### 4. Tag Management

#### Test Case 4.1: Create Tag

**Steps:**
1. Navigate to Tags section or create task
2. Click "Create Tag" or type new tag name
3. Enter tag details:
   - Name: `important`
   - Color: Red (#FF0000)
4. Click "Create" or "Save"

**Expected Results:**
- ✅ Tag is created
- ✅ Tag appears in tag list
- ✅ Tag is available when creating/editing tasks
- ✅ Tag color is displayed correctly

#### Test Case 4.2: Edit Tag

**Steps:**
1. Click "Edit" on a tag
2. Change name to: `very-important`
3. Change color to: Orange
4. Click "Save"

**Expected Results:**
- ✅ Tag name updates
- ✅ Tag color updates
- ✅ All tasks with this tag show updated name/color
- ✅ Changes persist after refresh

#### Test Case 4.3: Delete Tag

**Steps:**
1. Click "Delete" on a tag
2. Confirm deletion

**Expected Results:**
- ✅ Tag is deleted
- ✅ Tag is removed from all tasks
- ✅ Success message appears

#### Test Case 4.4: Tag Statistics

**Steps:**
1. Navigate to Tags page
2. View tag usage statistics

**Expected Results:**
- ✅ Shows number of tasks per tag
- ✅ Shows most used tags
- ✅ Can click tag to filter tasks

---

### 5. Notifications & Reminders

#### Test Case 5.1: Register for Notifications

**Steps:**
1. Login to application
2. Browser prompts for notification permission
3. Click "Allow"

**Expected Results:**
- ✅ Permission granted
- ✅ FCM token registered
- ✅ Token saved in Firestore
- ✅ Settings page shows notification status: "Enabled"

#### Test Case 5.2: Task Deadline Reminder

**Steps:**
1. Create task with due date: 1 hour from now
2. Set reminder: 30 minutes before
3. Wait for reminder time (or use Firebase Functions to trigger)

**Expected Results:**
- ✅ Notification appears 30 minutes before deadline
- ✅ Notification shows task title
- ✅ Clicking notification opens task details

#### Test Case 5.3: Overdue Task Alert

**Steps:**
1. Create task with due date in the past
2. Refresh page or wait for background job

**Expected Results:**
- ✅ Task shows "OVERDUE" badge
- ✅ Task appears in overdue section
- ✅ Notification sent (if enabled)
- ✅ Visual indicator (red color, warning icon)

---

### 6. Offline Support

#### Test Case 6.1: Work Offline

**Steps:**
1. Login to application
2. Open DevTools (F12) → Network tab
3. Toggle "Offline" mode
4. Try to create/edit tasks

**Expected Results:**
- ✅ UI remains functional
- ✅ Tasks are saved to local storage/IndexedDB
- ✅ "Offline" indicator appears
- ✅ Changes queued for sync

#### Test Case 6.2: Sync After Reconnect

**Steps:**
1. Make changes while offline
2. Turn network back online
3. Observe sync process

**Expected Results:**
- ✅ Queued changes sync automatically
- ✅ "Syncing..." indicator appears
- ✅ Changes appear in Firestore
- ✅ Success message: "Sync complete"
- ✅ Conflicts resolved (if any)

---

### 7. Time Tracking

#### Test Case 7.1: Start Time Tracking

**Steps:**
1. Open a task
2. Click "Start Timer" button
3. Observe timer counting

**Expected Results:**
- ✅ Timer starts counting
- ✅ Timer shows in task card
- ✅ Task status may change to "In Progress"
- ✅ Start time recorded

#### Test Case 7.2: Pause/Resume Timer

**Steps:**
1. Click "Pause" on running timer
2. Wait a few seconds
3. Click "Resume"

**Expected Results:**
- ✅ Timer pauses
- ✅ Elapsed time saved
- ✅ Timer resumes from paused time
- ✅ Total time accumulates correctly

#### Test Case 7.3: Stop Timer

**Steps:**
1. Click "Stop" on running timer
2. View task details

**Expected Results:**
- ✅ Timer stops
- ✅ Actual time recorded
- ✅ Can compare estimated vs actual time
- ✅ Time entry saved in history

---

### 8. Dashboard & Statistics

#### Test Case 8.1: View Dashboard

**Steps:**
1. Login and navigate to dashboard
2. Observe dashboard widgets

**Expected Results:**
- ✅ Shows task summary:
  - Total tasks
  - Completed tasks
  - In progress tasks
  - Overdue tasks
- ✅ Shows upcoming deadlines
- ✅ Shows productivity metrics
- ✅ Shows recent activity

#### Test Case 8.2: Task Statistics

**Steps:**
1. Navigate to Statistics/Analytics page
2. View task metrics

**Expected Results:**
- ✅ Shows completion rate
- ✅ Shows tasks by priority
- ✅ Shows tasks by tag
- ✅ Shows time spent per task
- ✅ Charts/graphs display correctly

---

## Test Scenarios

### Scenario 1: New User Onboarding (Complete Flow)

**Duration:** 10-15 minutes

1. [ ] Register new account
2. [ ] Verify email (if enabled)
3. [ ] Complete profile setup
4. [ ] Create first task
5. [ ] Add tags to task
6. [ ] Set due date and priority
7. [ ] Mark task as completed
8. [ ] View dashboard statistics

### Scenario 2: Daily Task Management

**Duration:** 15-20 minutes

1. [ ] Login to application
2. [ ] View today's tasks
3. [ ] Create 3 new tasks for today
4. [ ] Start working on first task (start timer)
5. [ ] Mark first task as completed
6. [ ] Edit second task (change priority)
7. [ ] Search for specific task
8. [ ] Filter tasks by priority
9. [ ] Check upcoming deadlines
10. [ ] Logout

### Scenario 3: Team Collaboration (if supported)

**Duration:** 20-30 minutes

1. [ ] Create shared task
2. [ ] Assign task to team member
3. [ ] Add comments to task
4. [ ] Receive notification about task update
5. [ ] View team dashboard
6. [ ] Filter tasks by assignee
7. [ ] Complete assigned task

### Scenario 4: Mobile Responsiveness

**Duration:** 10-15 minutes

1. [ ] Open app on mobile device or use DevTools device emulation
2. [ ] Test all core features:
   - [ ] Login/Registration
   - [ ] Create task
   - [ ] Edit task
   - [ ] View task list
   - [ ] Use filters
   - [ ] Search tasks
3. [ ] Verify UI is responsive and usable
4. [ ] Test touch interactions
5. [ ] Test orientation change (portrait/landscape)

### Scenario 5: Error Handling

**Duration:** 15-20 minutes

1. [ ] Try to create task without title → Error message
2. [ ] Try invalid email format → Validation error
3. [ ] Disconnect network mid-operation → Offline handling
4. [ ] Try to access protected route without login → Redirect to login
5. [ ] Submit form with very long text → Character limit validation
6. [ ] Rapid clicking on submit button → Prevent double submission
7. [ ] Invalid date format → Date validation error

---

## Known Issues & Troubleshooting

### Issue 1: Firebase Emulators Won't Start

**Symptoms:**
- Error: "Port already in use"
- Emulators fail to start

**Solutions:**
```bash
# Find and kill processes using the ports
lsof -ti:4000,5001,8080,9099 | xargs kill -9

# Or restart with different ports
firebase emulators:start --only firestore --port 8081
```

### Issue 2: Web App Won't Load

**Symptoms:**
- Blank white screen
- Console errors about modules

**Solutions:**
```bash
# Clear node_modules and reinstall
cd web
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf .vite
npm run dev
```

### Issue 3: Authentication Errors

**Symptoms:**
- "Network error" during login
- "Firebase not initialized"

**Solutions:**
1. Check Firebase config in `web/src/services/firebase/config.ts`
2. Verify emulators are running
3. Check browser console for specific error
4. Clear browser cache and cookies
5. Check if using correct Firebase project

### Issue 4: Tasks Not Appearing

**Symptoms:**
- Tasks created but don't show up
- Empty task list despite data in Firestore

**Solutions:**
1. Check Firestore Emulator UI (http://localhost:4000)
2. Verify user ID matches task userId
3. Check console for query errors
4. Verify security rules allow read access
5. Hard refresh page (Ctrl+Shift+R)

### Issue 5: Notifications Not Working

**Symptoms:**
- No notification permission prompt
- Notifications not received

**Solutions:**
1. Check browser notification permissions
2. Verify FCM is configured correctly
3. Check service worker registration
4. Test with browser notification API:
   ```javascript
   Notification.requestPermission()
   ```
5. Check FCM token in Firestore

---

## Testing Checklist Summary

### Pre-Testing Setup
- [ ] Dependencies installed
- [ ] Firebase emulators running
- [ ] Web app running
- [ ] Browser DevTools open (for debugging)

### Core Features (Must Test)
- [ ] User Registration
- [ ] User Login
- [ ] Create Task
- [ ] Edit Task
- [ ] Delete Task
- [ ] Filter Tasks
- [ ] Search Tasks
- [ ] Logout

### Extended Features (Should Test)
- [ ] Google OAuth
- [ ] Password Reset
- [ ] Profile Update
- [ ] Tag Management
- [ ] Time Tracking
- [ ] Notifications
- [ ] Offline Mode
- [ ] Dashboard Statistics

### Edge Cases (Nice to Test)
- [ ] Very long task titles/descriptions
- [ ] Special characters in input
- [ ] Multiple tabs open simultaneously
- [ ] Network interruptions
- [ ] Browser back/forward buttons
- [ ] Page refresh during operations

---

## Reporting Issues

If you find any issues during testing, please document:

1. **Steps to Reproduce:** Exact steps that trigger the issue
2. **Expected Behavior:** What should happen
3. **Actual Behavior:** What actually happens
4. **Screenshots:** If applicable
5. **Browser/Device:** Which browser and OS
6. **Console Errors:** Any errors in browser console
7. **Network Tab:** Any failed requests

**Example Issue Report:**
```
Title: Task not saving when title exceeds 200 characters

Steps:
1. Click "Create Task"
2. Enter title with 250 characters
3. Click "Save"

Expected: Error message about character limit
Actual: Form submits but task doesn't save, no error shown

Browser: Chrome 120.0, macOS 14.0
Console Error: "ValidationError: Title too long"
```

---

## Contact & Support

For questions or assistance:
- Check documentation: `/docs/API.md`
- Review code comments in source files
- Check Firebase console for errors
- Review emulator logs

---

**Happy Testing! 🎉**

Remember: Good testing helps build better software. Take your time and be thorough!
