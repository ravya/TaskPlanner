# GitHub Issues - TaskPlanner

This document tracks all pending bug fixes and feature requests extracted from development conversations.

---

## 🐛 Bug Fixes

### Issue #1: Newly Added Tasks Not Visible on Today Screen
**Priority:** High  
**Labels:** `bug`, `mobile`, `critical`

**Description:**  
Newly added tasks are not appearing on the "Today" screen. Users have to navigate away and return to see their newly created tasks.

**Expected Behavior:**  
Tasks should appear immediately on the Today screen after creation.

**Affected Platforms:** Mobile (iOS & Android)

---

### Issue #2: Google OAuth Redirect URI Configuration
**Priority:** High  
**Labels:** `bug`, `authentication`, `mobile`

**Description:**  
The Google OAuth redirect URI is not configured correctly, causing authentication failures on mobile devices.

**Steps to Reproduce:**
1. Open mobile app
2. Tap "Sign in with Google"
3. Authentication fails with redirect error

**Affected Platforms:** Mobile (iOS & Android)

---

### Issue #3: Tab Bar Icon Inconsistency
**Priority:** Medium  
**Labels:** `bug`, `ui`, `mobile`

**Description:**  
Tab bar icons are not consistently showing outlined (inactive) vs filled (active) states across all navigation items.

**Expected Behavior:**  
- Inactive tab: Outlined icon
- Active tab: Filled icon

**Affected Platforms:** Mobile

---

### Issue #4: Multi-Select Toolbar Padding Issues
**Priority:** Low  
**Labels:** `bug`, `ui`, `mobile`

**Description:**  
The multi-select toolbar has incorrect padding. Should use icons only (no text) and fix spacing issues.

**Affected Platforms:** Mobile

---

## ✨ Feature Requests

### Issue #5: Mode Naming Standardization (Personal/Professional → Home/Work)
**Priority:** High  
**Labels:** `enhancement`, `ui`, `breaking-change`

**Description:**  
Standardize mode naming from "Personal/Professional" to "Home/Work" across the entire application for consistency.

**Scope:**
- [ ] Update UI labels on mobile
- [ ] Update UI labels on web
- [ ] Update Firestore data schema
- [ ] Data migration for existing users

**Affected Platforms:** Web, Mobile

---

### Issue #6: Task Editing via Tap
**Priority:** High  
**Labels:** `enhancement`, `mobile`, `ux`

**Description:**  
Enable task editing functionality by tapping on a task. Currently, there's no way to edit a task after creation on mobile.

**Acceptance Criteria:**
- Tapping a task opens edit modal/screen
- All task fields should be editable
- Changes save back to Firestore

**Affected Platforms:** Mobile

---

### Issue #7: Replace Priority Dots with Label Badges
**Priority:** Medium  
**Labels:** `enhancement`, `ui`, `mobile`

**Description:**  
Replace priority indicator dots with label badges on task cards for better visual hierarchy and consistency with our labels-only approach.

**Affected Platforms:** Mobile, Web

---

### Issue #8: Remove Project Color Picker
**Priority:** Low  
**Labels:** `enhancement`, `simplification`

**Description:**  
Remove the project color picker to streamline project creation. Use default colors or auto-assign colors.

**Affected Platforms:** Mobile, Web

---

### Issue #9: TodayStickiesWidget - Project Grouping Enhancement
**Priority:** Medium  
**Labels:** `enhancement`, `widget`, `web`

**Description:**  
Update the TodayStickiesWidget to display tasks categorized by their project titles for better organization.

**Acceptance Criteria:**
- Group tasks under project headers
- Show ungrouped tasks under "No Project" section
- Collapsible project sections

**Affected Platforms:** Web, Mobile

---

### Issue #10: Project Editing UI
**Priority:** Medium  
**Labels:** `enhancement`, `projects`

**Description:**  
Implement a user interface for editing project details. Should be via a modal or inline editing, not a separate page.

**Features:**
- Edit project name
- Edit project description
- Change project status (done/active)

**Affected Platforms:** Mobile, Web

---

### Issue #11: Mobile Widget for Phone
**Priority:** High  
**Labels:** `enhancement`, `mobile`, `widget`

**Description:**  
Create a native widget for mobile phones (iOS Widget / Android Widget) showing today's tasks at a glance.

**Features:**
- Show today's tasks count
- Quick list of upcoming tasks
- Tap to open app

**Affected Platforms:** iOS, Android

---

### Issue #12: Calendar View
**Priority:** Medium  
**Labels:** `enhancement`, `feature`

**Description:**  
Implement a calendar view for visualizing tasks across dates. Part of the "Coming Soon" features.

**Features:**
- Monthly calendar view
- Tasks displayed on their due dates
- Tap date to view/add tasks

**Affected Platforms:** Web, Mobile

---

### Issue #13: Task Comments
**Priority:** Low  
**Labels:** `enhancement`, `feature`

**Description:**  
Add ability to add comments to tasks for collaboration and notes.

**Features:**
- Add comments to tasks
- View comment history
- Edit/delete own comments

**Affected Platforms:** Web, Mobile

---

### Issue #14: Time Tracking
**Priority:** Low  
**Labels:** `enhancement`, `feature`

**Description:**  
Implement time tracking functionality for tasks to help users understand how long tasks take.

**Features:**
- Start/stop timer on tasks
- View time spent per task
- Time tracking reports in analytics

**Affected Platforms:** Web, Mobile

---

### Issue #15: Task Templates
**Priority:** Low  
**Labels:** `enhancement`, `feature`

**Description:**  
Create reusable task templates for frequently created tasks.

**Features:**
- Create templates from existing tasks
- Apply templates when creating new tasks
- Manage template library

**Affected Platforms:** Web, Mobile

---

### Issue #16: Unit Tests for Project Service
**Priority:** Medium  
**Labels:** `testing`, `projects`

**Description:**  
Develop unit tests for the `project.service.ts` to ensure its core logic and validation are sound.

**Test Coverage:**
- Project CRUD operations
- Validation logic
- Error handling

---

### Issue #17: Integration Tests for Project Components
**Priority:** Medium  
**Labels:** `testing`, `projects`

**Description:**  
Develop integration tests for frontend components that interact with the project service.

**Components to Test:**
- ProjectList
- AddProjectModal
- Dashboard (project section)
- Tasks page (project filter)

---

## 📋 Summary

| Type | Count |
|------|-------|
| 🐛 Bugs | 4 |
| ✨ Features | 13 |
| **Total** | **17** |

### Priority Breakdown

| Priority | Count |
|----------|-------|
| High | 5 |
| Medium | 8 |
| Low | 4 |

---

*Last updated: 2026-01-07*
