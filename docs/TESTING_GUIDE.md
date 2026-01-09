# TaskPlanner - Testing Guide

> Comprehensive testing guide combining quick start, detailed testing, and checklists.

## Quick Links

| Resource | URL |
|----------|-----|
| Web App | http://localhost:3000 |
| Emulator UI | http://127.0.0.1:4000 |
| Auth Emulator | http://127.0.0.1:9099 |
| Firestore Emulator | http://127.0.0.1:8080 |

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start Services

**Terminal 1 - Firebase Emulators:**
```bash
cd /Users/preeti/Documents/TaskPlanner
npm start
```

**Terminal 2 - Web App:**
```bash
cd /Users/preeti/Documents/TaskPlanner/web
npm run dev
```

### Step 2: Quick Test
1. Open http://localhost:3000
2. Register with `test@example.com` / `Test123!@#`
3. Create a task → Edit it → Mark complete → Delete it
4. Check Emulator UI at http://127.0.0.1:4000

---

## 🧪 Automated Tests

### Unit Tests (Vitest)
```bash
cd web && npm test              # Run all tests
npm test -- --coverage          # With coverage
npm run test:ui                 # Interactive UI
```

**Expected:** 130/132 tests passing (98.5%)

### E2E Tests (Cypress)
```bash
npm run test:e2e               # Open Cypress UI
npm run test:e2e:headless      # Run headless
```

**Test files in `/cypress/e2e/`:**
- `authentication.cy.ts` - Login, register, logout flows
- `task-management.cy.ts` - Task CRUD operations
- `tag-management.cy.ts` - Tag management
- `cross-browser.cy.ts` - Cross-browser compatibility

---

## ✅ Testing Checklist

### Authentication
- [ ] Register with valid email/password
- [ ] Login with credentials
- [ ] Logout redirects to login
- [ ] Invalid credentials show error

### Task Management
- [ ] Create task with all fields
- [ ] Edit task title, priority, date
- [ ] Mark task complete/incomplete
- [ ] Delete task with confirmation
- [ ] Filter by status/priority
- [ ] Search tasks

### Tag Management
- [ ] Create new tag with color
- [ ] Assign tags to tasks
- [ ] Filter tasks by tag
- [ ] Delete tag

### Mobile Responsiveness
- [ ] UI works on mobile viewport
- [ ] Touch interactions work
- [ ] Navigation accessible

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000,4000,5001,8080,9099 | xargs kill -9
```

### Emulators Won't Start
```bash
cd functions && npm run build && cd ..
rm -rf ~/.firebase
npm start
```

### Tests Failing
```bash
cd web && rm -rf node_modules && npm install && npm test
```

---

## 📊 Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Button | 30/30 | ✅ Pass |
| Input | 38/38 | ✅ Pass |
| SearchInput | 8/8 | ✅ Pass |
| useAuth Hook | 38/40 | ⚠️ 2 known |
| Validation | 14/14 | ✅ Pass |
| Task List | 12/12 | ✅ Pass |

**Known Issues:** 2 mock configuration issues in useAuth tests (non-critical)
