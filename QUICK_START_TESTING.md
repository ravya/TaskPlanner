# TaskFlow - Quick Start Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Application

```bash
# Terminal 1 - Start Firebase Emulators
cd /Users/preeti/Documents/TaskPlanner
npm start
```

Wait for this message:
```
✔  All emulators ready! View status at http://localhost:4000
```

```bash
# Terminal 2 - Start Web App
cd /Users/preeti/Documents/TaskPlanner/web
npm run dev
```

Wait for this message:
```
➜  Local:   http://localhost:3000/
```

### Step 2: Open the App

Open your browser and go to: **http://localhost:3000**

### Step 3: Quick Test Flow (5 Minutes)

#### ✅ Test 1: Register (1 min)
1. Click **"Sign Up"** or **"Register"**
2. Fill in:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - Name: `Test User`
3. Click **"Register"**
4. ✅ You should see the dashboard

#### ✅ Test 2: Create Task (1 min)
1. Click **"Create Task"** or **"+"** button
2. Fill in:
   - Title: `My First Task`
   - Description: `Testing the app`
   - Priority: `High`
3. Click **"Save"** or **"Create"**
4. ✅ Task should appear in the list

#### ✅ Test 3: Edit Task (1 min)
1. Click on the task you just created
2. Click **"Edit"**
3. Change priority to: `Medium`
4. Click **"Save"**
5. ✅ Task should update

#### ✅ Test 4: Search & Filter (1 min)
1. In search box, type: `First`
2. ✅ Your task should appear
3. Click **"Priority: High"** filter
4. ✅ Only high priority tasks show

#### ✅ Test 5: Complete & Delete (1 min)
1. Click checkbox or **"Mark Complete"** on your task
2. ✅ Task should show as completed
3. Click **"Delete"** icon
4. Confirm deletion
5. ✅ Task should be removed

### Step 4: Check Firebase Emulator

Open: **http://localhost:4000**

You should see:
- **Firestore:** Your tasks and user data
- **Authentication:** Your test user
- **Functions:** Any triggered functions

---

## 🧪 Unit Tests (Run All Tests)

```bash
# Run unit tests
cd /Users/preeti/Documents/TaskPlanner/web
npm test

# Expected output:
# ✓ 130 tests passing
# ✗ 2 tests failing (known issues in useAuth)
```

---

## 🌐 E2E Tests (Run Cypress)

```bash
# Open Cypress Test Runner
cd /Users/preeti/Documents/TaskPlanner
npm run test:e2e

# Or run headless
npm run test:e2e:headless
```

**Existing E2E Tests:**
- ✅ Authentication (login, register, logout)
- ✅ Task Management (create, edit, delete)
- ✅ Tag Management
- ✅ Cross-browser compatibility

---

## 📱 Test on Mobile

### Using Chrome DevTools
1. Press **F12** to open DevTools
2. Click **Toggle Device Toolbar** (or Ctrl+Shift+M)
3. Select device: **iPhone 12 Pro** or **iPad**
4. Test all features on mobile view

### Using Real Device
1. Find your local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep inet

   # Windows
   ipconfig
   ```
2. On your mobile device, open: `http://YOUR_IP:3000`
3. Test all features

---

## 🐛 Common Issues & Quick Fixes

### Issue: Port Already in Use

```bash
# Kill processes on ports
lsof -ti:3000,4000,5001,8080,9099 | xargs kill -9

# Then restart
npm start
```

### Issue: White Screen / App Won't Load

```bash
cd /Users/preeti/Documents/TaskPlanner/web
rm -rf node_modules .vite
npm install
npm run dev
```

### Issue: Tests Failing

```bash
# Clear test cache
cd /Users/preeti/Documents/TaskPlanner/web
rm -rf node_modules/.vite
npm test -- --run
```

### Issue: Firebase Connection Error

1. Check if emulators are running: http://localhost:4000
2. Verify `web/src/services/firebase/config.ts` points to emulator
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh page (Ctrl+Shift+R)

---

## 📊 Test Coverage Report

```bash
cd /Users/preeti/Documents/TaskPlanner/web
npm test -- --coverage

# View HTML report
open coverage/index.html
```

---

## 🎯 Priority Test Scenarios

### Scenario 1: Happy Path (3 minutes)
- [ ] Register → Create Task → Complete Task → Logout

### Scenario 2: Task Management (5 minutes)
- [ ] Create 5 tasks with different priorities
- [ ] Filter by priority
- [ ] Search tasks
- [ ] Edit multiple tasks
- [ ] Delete tasks

### Scenario 3: Error Handling (3 minutes)
- [ ] Try invalid email → See error
- [ ] Try short password → See error
- [ ] Create task without title → See error
- [ ] Go offline → See offline indicator

---

## 📝 Test Checklist

Print this and check off as you test:

```
□ App loads without errors
□ Can register new user
□ Can login
□ Can create task
□ Can edit task
□ Can delete task
□ Can filter tasks
□ Can search tasks
□ Can add tags
□ Can logout
□ Notifications work (if enabled)
□ Offline mode works
□ Mobile view works
□ All unit tests pass
□ All E2E tests pass
```

---

## 🆘 Need Help?

1. **Check logs:**
   - Browser Console (F12)
   - Firebase Emulator UI (http://localhost:4000)
   - Terminal output

2. **Review documentation:**
   - [COMPLETE_SETUP.md](COMPLETE_SETUP.md) - Full setup guide
   - [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) - Detailed testing
   - [TEST_RESULTS.md](web/TEST_RESULTS.md) - Test coverage report

3. **Debug with DevTools:**
   - Network tab - Check failed requests
   - Console tab - Check errors
   - Application tab - Check local storage
   - Sources tab - Set breakpoints

---

## 🎉 Success Criteria

Your application is working correctly if:

✅ No console errors on page load
✅ Can complete registration flow
✅ Can create, edit, and delete tasks
✅ Filters and search work
✅ Data persists after page refresh
✅ 130+ unit tests passing
✅ E2E tests complete successfully

---

## Next Steps

After basic testing, try:

1. **Advanced Features:**
   - Time tracking
   - Bulk operations
   - Tag statistics
   - Dashboard analytics

2. **Performance Testing:**
   - Create 100+ tasks
   - Test search performance
   - Test filter performance
   - Check memory usage

3. **Security Testing:**
   - Try accessing other users' data
   - Test with expired tokens
   - Test SQL injection in search
   - Test XSS in task descriptions

4. **Accessibility Testing:**
   - Use keyboard only (no mouse)
   - Use screen reader
   - Check color contrast
   - Test with different zoom levels

---

**Happy Testing! 🚀**

Remember: Testing is not about finding no bugs, it's about finding bugs before users do!
