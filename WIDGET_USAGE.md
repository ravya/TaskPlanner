# TaskPlanner Widget - macOS Usage Guide

The widget provides a compact, easy-access view of your today's tasks, similar to the macOS Notes widget.

## Features

- **Compact Design**: Lightweight interface optimized for a small window
- **Today's Tasks Only**: Shows only tasks scheduled for today
- **Quick Stats**: Total tasks, completed count, and completion percentage
- **Priority Sorting**: Tasks automatically sorted by priority (high to low)
- **Quick Complete**: Toggle task completion with a single click
- **Auto-Refresh**: Updates every 30 seconds automatically
- **Progress Bar**: Visual progress indicator for today's tasks

## Accessing the Widget

1. Make sure the Firebase emulators are running:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://127.0.0.1:3000/widget
   ```

3. Log in with your credentials (e.g., test@example.com / test123456)

## Using as a Standalone Widget on macOS

### Option 1: Browser Window (Easiest)

1. Open the widget URL in your browser
2. Make the window smaller (recommended: 400-500px wide, 600-800px tall)
3. On **Safari**:
   - Go to File → Add to Dock
   - This creates a standalone app-like icon
4. On **Chrome**:
   - Click the "Install" icon in the address bar (if available)
   - Or bookmark the page for quick access

### Option 2: Standalone App Window (Chrome/Edge)

1. Open Chrome or Edge
2. Navigate to `http://127.0.0.1:3000/widget`
3. Click the three dots menu (⋮) → More Tools → Create Shortcut
4. Check "Open as window"
5. Click "Create"
6. The widget will open as a standalone app window

### Option 3: Using Fluid App (Professional)

Fluid is a macOS app that converts websites into standalone applications.

1. Download Fluid from: https://fluidapp.com/
2. Install and open Fluid
3. Enter:
   - **URL**: `http://127.0.0.1:3000/widget`
   - **Name**: TaskPlanner Widget
   - **Icon**: Choose an icon or let it auto-generate
4. Click "Create"
5. The widget will be created as a standalone macOS app

**Note**: Fluid requires the emulators to be running. The app will only work when `npm start` is active.

### Option 4: Keyboard Shortcut (Advanced)

Create a quick launch shortcut:

1. Open **Automator** (Applications → Automator)
2. Create a new "Quick Action"
3. Add "Run Shell Script" action
4. Paste:
   ```bash
   open -a "Google Chrome" http://127.0.0.1:3000/widget
   ```
5. Save as "Open TaskPlanner Widget"
6. Go to System Settings → Keyboard → Shortcuts → Services
7. Find "Open TaskPlanner Widget" and assign a keyboard shortcut

## Widget Behavior

- **Task Completion**: Click the checkbox to mark tasks as complete/incomplete
- **Task Display**: Shows up to 500px of scrollable tasks
- **Completed Tasks**: Appear with reduced opacity at the bottom of the list
- **Priority Indicators**: Colored bars next to each task (red=high, yellow=medium, green=low)
- **Time Display**: Shows task time or "All day" if no time is set
- **Description Truncation**: Long descriptions are truncated to 50 characters

## Tips for Best Experience

1. **Keep it Small**: Resize the window to widget-like dimensions (400x600px works well)
2. **Always on Top**: Use browser extensions like "Always On Top" to keep the widget visible
3. **Multiple Displays**: Perfect for secondary monitors
4. **Quick Glance**: Designed for fast task overview without opening the full app

## Switching to Full App

Click "Open Full App →" at the bottom of the widget to navigate to the full dashboard.

## Troubleshooting

### Widget not loading
- Ensure Firebase emulators are running: `npm start`
- Check that you're logged in
- Verify the URL is `http://127.0.0.1:3000/widget`

### Tasks not showing
- Widget only shows tasks with `startDate` set to today
- Check the full app to verify tasks have today's date

### Auto-refresh not working
- The widget refreshes every 30 seconds automatically
- If tasks don't update, click the refresh button in the header

### Standalone app not connecting
- The emulators must be running for the widget to work
- If you stop `npm start`, the widget will lose connection
