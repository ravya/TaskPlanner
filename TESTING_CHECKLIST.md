# TaskFlow - Testing Checklist

Use this checklist to track your testing progress. Check off items as you complete them.

---

## 🚀 Setup & Environment

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase emulators running
- [ ] Web app running on http://localhost:3000
- [ ] Browser DevTools open (F12)
- [ ] Emulator UI accessible at http://localhost:4000

---

## 👤 Authentication & User Management

### Registration
- [ ] Can access registration page
- [ ] Can register with valid email and password
- [ ] Shows error for invalid email format
- [ ] Shows error for weak password (<8 chars)
- [ ] Shows error when passwords don't match
- [ ] Shows error for existing email
- [ ] Redirects to dashboard after successful registration
- [ ] User appears in Firebase Auth Emulator

### Login
- [ ] Can access login page
- [ ] Can login with correct credentials
- [ ] Shows error for wrong password
- [ ] Shows error for non-existent user
- [ ] Shows error for empty fields
- [ ] "Remember me" checkbox works
- [ ] Redirects to dashboard after login
- [ ] User avatar/name appears in header

### Google OAuth
- [ ] "Sign in with Google" button visible
- [ ] Google OAuth popup opens
- [ ] Can authenticate with Google account
- [ ] Profile populated with Google data
- [ ] Google profile picture displayed

### Password Reset
- [ ] "Forgot Password" link works
- [ ] Can enter email for reset
- [ ] Success message appears
- [ ] Reset email sent (check emulator)
- [ ] Can set new password via reset link

### Profile Management
- [ ] Can access profile page
- [ ] Can update display name
- [ ] Can upload profile picture
- [ ] Changes save successfully
- [ ] Changes persist after refresh
- [ ] Success message appears

### Logout
- [ ] Logout button accessible
- [ ] Logout confirmation (if applicable)
- [ ] Redirects to login page
- [ ] Cannot access protected routes after logout
- [ ] Local storage cleared

---

## 📝 Task Management

### Create Task
- [ ] "Create Task" button visible and accessible
- [ ] Task creation modal/form opens
- [ ] Can enter task title
- [ ] Can enter task description
- [ ] Can select priority (Low, Medium, High, Critical)
- [ ] Can set due date
- [ ] Can add tags
- [ ] Can set estimated time
- [ ] Task saves successfully
- [ ] Success message appears
- [ ] Task appears in task list
- [ ] Task appears in Firestore Emulator

### View Tasks
- [ ] Task list displays on dashboard
- [ ] All tasks visible
- [ ] Task cards show title
- [ ] Task cards show description (truncated if long)
- [ ] Task cards show priority indicator
- [ ] Task cards show due date
- [ ] Task cards show tags
- [ ] Task cards show status
- [ ] Tasks sorted correctly (by date/priority)

### View Task Details
- [ ] Can click task to view details
- [ ] Task detail modal/page opens
- [ ] All task information displayed
- [ ] Can see full description
- [ ] Can see all metadata (created, updated dates)

### Edit Task
- [ ] Edit button accessible
- [ ] Edit form pre-populated with task data
- [ ] Can modify title
- [ ] Can modify description
- [ ] Can change priority
- [ ] Can change status
- [ ] Can change due date
- [ ] Can add/remove tags
- [ ] Changes save successfully
- [ ] Task updates in list immediately
- [ ] Changes persist after refresh

### Update Task Status
- [ ] Can change status to "Todo"
- [ ] Can change status to "In Progress"
- [ ] Can change status to "Completed"
- [ ] Status updates immediately
- [ ] Completed tasks show completion timestamp
- [ ] Task moves to appropriate section (if Kanban)

### Delete Task
- [ ] Delete button accessible
- [ ] Confirmation dialog appears
- [ ] Can confirm deletion
- [ ] Can cancel deletion
- [ ] Task removed after confirmation
- [ ] Success message appears
- [ ] Task soft-deleted in database

### Bulk Operations
- [ ] Can select multiple tasks (checkboxes)
- [ ] Bulk actions menu appears
- [ ] Can bulk mark as completed
- [ ] Can bulk delete
- [ ] Can bulk change priority
- [ ] Can bulk add tags
- [ ] All selected tasks update correctly

---

## 🔍 Search & Filtering

### Search
- [ ] Search box visible
- [ ] Can type in search box
- [ ] Search is debounced (no instant search)
- [ ] Results filter as you type
- [ ] Search is case-insensitive
- [ ] Searches in title
- [ ] Searches in description
- [ ] Clear button appears when typing
- [ ] Can clear search
- [ ] Shows "No results" when no matches

### Filter by Status
- [ ] Status filter dropdown accessible
- [ ] Can select "Todo"
- [ ] Can select "In Progress"
- [ ] Can select "Completed"
- [ ] Can select "All"
- [ ] Filter applies immediately
- [ ] Filter badge/indicator appears
- [ ] Shows count of filtered tasks

### Filter by Priority
- [ ] Priority filter accessible
- [ ] Can select "Low"
- [ ] Can select "Medium"
- [ ] Can select "High"
- [ ] Can select "Critical"
- [ ] Can select "All"
- [ ] Filter applies correctly

### Filter by Tags
- [ ] Tag filter accessible
- [ ] Can select tags
- [ ] Can select multiple tags
- [ ] Tasks with selected tags shown
- [ ] Can clear tag filter

### Filter by Due Date
- [ ] Can filter "Overdue"
- [ ] Can filter "Due Today"
- [ ] Can filter "Due This Week"
- [ ] Can filter "No Due Date"
- [ ] Date filters work correctly

### Combined Filters
- [ ] Can apply multiple filters simultaneously
- [ ] Filters use AND logic (all conditions must match)
- [ ] Filter badges show all active filters
- [ ] "Clear all filters" button works
- [ ] Clearing filters shows all tasks

---

## 🏷️ Tag Management

### Create Tag
- [ ] Can create new tag
- [ ] Can set tag name
- [ ] Can set tag color
- [ ] Tag saves successfully
- [ ] Tag appears in tag list
- [ ] Tag available when creating tasks

### Edit Tag
- [ ] Can edit tag name
- [ ] Can edit tag color
- [ ] Changes save successfully
- [ ] All tasks with tag update

### Delete Tag
- [ ] Can delete tag
- [ ] Confirmation appears
- [ ] Tag removed from all tasks
- [ ] Tag deleted successfully

### Tag Statistics
- [ ] Can view tag usage count
- [ ] Can see most used tags
- [ ] Can click tag to filter tasks

---

## 🔔 Notifications & Reminders

### Permission
- [ ] Browser prompts for notification permission
- [ ] Can allow notifications
- [ ] Can deny notifications
- [ ] Permission status shown in settings

### Task Reminders
- [ ] Can set reminder on task
- [ ] Reminder time options available
- [ ] Notification sent at reminder time
- [ ] Notification shows task title
- [ ] Clicking notification opens task

### Overdue Alerts
- [ ] Overdue tasks show indicator
- [ ] Overdue tasks appear in separate section
- [ ] Notification sent for overdue tasks

---

## ⏱️ Time Tracking

### Start Timer
- [ ] "Start Timer" button visible
- [ ] Timer starts counting
- [ ] Timer shows in task card
- [ ] Start time recorded

### Pause/Resume Timer
- [ ] Can pause timer
- [ ] Elapsed time saved
- [ ] Can resume timer
- [ ] Timer continues from paused time

### Stop Timer
- [ ] Can stop timer
- [ ] Total time recorded
- [ ] Can view time history
- [ ] Actual time vs estimated time shown

---

## 📊 Dashboard & Statistics

### Dashboard
- [ ] Dashboard accessible
- [ ] Shows total tasks
- [ ] Shows completed tasks
- [ ] Shows in-progress tasks
- [ ] Shows overdue tasks
- [ ] Shows upcoming deadlines
- [ ] Shows productivity metrics

### Statistics
- [ ] Can view completion rate
- [ ] Can view tasks by priority
- [ ] Can view tasks by tag
- [ ] Charts/graphs display correctly
- [ ] Can filter statistics by date range

---

## 📴 Offline Support

### Offline Mode
- [ ] Can work offline (disconnect network)
- [ ] "Offline" indicator appears
- [ ] Can create tasks offline
- [ ] Can edit tasks offline
- [ ] Can delete tasks offline
- [ ] Changes saved to local storage

### Sync
- [ ] Changes sync when back online
- [ ] "Syncing" indicator appears
- [ ] All changes appear in Firestore
- [ ] Conflicts resolved correctly
- [ ] Success message after sync

---

## 📱 Mobile Responsiveness

### Mobile View
- [ ] App loads on mobile
- [ ] UI is responsive
- [ ] Navigation menu works (hamburger)
- [ ] All features accessible
- [ ] Touch interactions work
- [ ] Forms are usable
- [ ] Buttons are tappable (min 44x44px)

### Tablet View
- [ ] Layout adjusts for tablet
- [ ] Sidebar visible (if applicable)
- [ ] All features accessible

### Orientation
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Layout adjusts on orientation change

---

## 🔒 Security & Validation

### Input Validation
- [ ] Email validation works
- [ ] Password strength validation works
- [ ] Required fields enforced
- [ ] Character limits enforced
- [ ] Date validation works
- [ ] Sanitizes user input (XSS prevention)

### Authorization
- [ ] Cannot access dashboard without login
- [ ] Cannot access other users' tasks
- [ ] Cannot edit other users' tasks
- [ ] Cannot delete other users' tasks
- [ ] Protected routes redirect to login

### Session Management
- [ ] Session persists across page refresh
- [ ] Session expires after inactivity (if configured)
- [ ] Can handle expired tokens
- [ ] Multiple tabs stay synchronized

---

## ⚡ Performance

### Load Time
- [ ] App loads in <3 seconds
- [ ] No blank white screen
- [ ] Progressive loading (skeleton screens)

### Large Data Sets
- [ ] Can handle 100+ tasks
- [ ] Search remains fast
- [ ] Filters remain responsive
- [ ] No UI freezing
- [ ] Pagination works (if implemented)

### Network
- [ ] Handles slow network gracefully
- [ ] Shows loading indicators
- [ ] Handles network errors
- [ ] Retries failed requests

---

## ♿ Accessibility

### Keyboard Navigation
- [ ] Can navigate with Tab key
- [ ] Can use Enter to submit forms
- [ ] Can use Escape to close modals
- [ ] Focus indicators visible
- [ ] Logical tab order

### Screen Reader
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] ARIA labels present
- [ ] Headings structured correctly

### Visual
- [ ] Color contrast meets WCAG AA
- [ ] Text is readable at 200% zoom
- [ ] No information conveyed by color alone
- [ ] Focus indicators visible

---

## 🐛 Error Handling

### Form Errors
- [ ] Shows validation errors
- [ ] Error messages are clear
- [ ] Can correct errors and resubmit
- [ ] Success messages appear

### Network Errors
- [ ] Shows error when offline
- [ ] Shows error for failed requests
- [ ] Provides retry option
- [ ] Handles 404 errors
- [ ] Handles 500 errors
- [ ] Handles timeout errors

### Edge Cases
- [ ] Handles very long text
- [ ] Handles special characters
- [ ] Handles rapid clicking
- [ ] Handles browser back button
- [ ] Handles page refresh during operation

---

## 🧪 Automated Tests

### Unit Tests
- [ ] All unit tests pass (`npm test`)
- [ ] Test coverage >80%
- [ ] No test failures
- [ ] No console warnings during tests

### E2E Tests
- [ ] Authentication tests pass
- [ ] Task management tests pass
- [ ] Tag management tests pass
- [ ] Cross-browser tests pass

---

## 🌐 Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

### Edge
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

---

## 📈 Test Results Summary

**Test Date:** _______________

**Tester Name:** _______________

**Total Tests:** _____

**Passed:** _____

**Failed:** _____

**Pass Rate:** _____%

**Critical Issues Found:** _____

**Minor Issues Found:** _____

**Overall Status:** ⬜ PASS  ⬜ FAIL  ⬜ PARTIAL

---

## 📝 Notes & Issues

Use this space to document any issues found:

```
Issue #1:
Description:
Steps to Reproduce:
Expected:
Actual:
Severity: [ ] Critical  [ ] Major  [ ] Minor
Screenshot:


Issue #2:
Description:
Steps to Reproduce:
Expected:
Actual:
Severity: [ ] Critical  [ ] Major  [ ] Minor
Screenshot:


Issue #3:
Description:
Steps to Reproduce:
Expected:
Actual:
Severity: [ ] Critical  [ ] Major  [ ] Minor
Screenshot:
```

---

**Testing Complete!** ✅

Please review all items and ensure comprehensive test coverage before deployment.
