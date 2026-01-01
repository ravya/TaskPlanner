# Today's Tasks Stickies Widget

A minimal macOS Stickies-inspired widget for your daily tasks.

## Quick Start

1. Run the app on port 8080:
   ```bash
   cd /Users/preeti/Documents/TaskPlanner
   firebase emulators:start --only auth,firestore  # Terminal 1
   
   cd /Users/preeti/Documents/TaskPlanner/web
   npm run dev -- --port 8080                      # Terminal 2
   ```

2. Visit: **http://localhost:8080/stickies**

---

## Add Widget to Desktop (macOS)

### Option 1: Chrome App Mode (Recommended)

1. Open Terminal and run:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --app=http://localhost:8080/stickies \
     --window-size=350,500
   ```

2. The widget opens as a standalone window (no browser chrome)
3. Position it anywhere on your desktop
4. Create an alias/shortcut for quick access

### Option 2: Create a Desktop Shortcut

1. Create a file called `TodaysStickies.command`:
   ```bash
   #!/bin/bash
   cd /Users/preeti/Documents/TaskPlanner
   osascript -e 'tell app "Terminal" to do script "cd /Users/preeti/Documents/TaskPlanner && firebase emulators:start --only auth,firestore"'
   sleep 5
   cd web && npm run dev -- --port 8080 &
   sleep 3
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --app=http://localhost:8080/stickies --window-size=350,500
   ```

2. Make it executable: `chmod +x TodaysStickies.command`
3. Double-click to launch!

### Option 3: Safari Add to Dock

1. Open Safari and go to http://localhost:8080/stickies
2. File → Add to Dock
3. Click the dock icon to launch

---

## Using the Widget

| Action | How |
|--------|-----|
| Add task | Click `+` at bottom, type, press Enter |
| Complete task | Click the checkbox |
| Uncomplete | Click the green checkbox again |

---

## Features

- 📝 Yellow sticky note design
- ✅ One-liner tasks (minimal)
- ➕ Quick add with + button
- 🎨 Priority color bars
- 📊 Progress tracking

---

## Embedding in Other Pages

```tsx
import TodayStickiesWidget from '../components/TodayStickiesWidget';

function MyPage() {
  return <TodayStickiesWidget />;
}
```

---

Enjoy your sticky widget! 📝
