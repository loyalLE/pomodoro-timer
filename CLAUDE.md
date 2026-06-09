# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言偏好
所有对话和回复必须使用中文。

## Repository Overview

This is a monorepo workspace (`cc-workspace`) containing a Pomodoro Timer desktop application built with Electron. The actual app lives in `pomodoro/`; the root `package.json` provides convenience scripts for launching into it.

## Common Commands

```bash
# Install pomodoro dependencies
cd pomodoro && npm install

# Run the app in development
cd pomodoro && npm start

# Build Windows portable executable
cd pomodoro && npm run build

# Build Windows installer (NSIS)
cd pomodoro && npm run build:installer
```

From the workspace root:
```bash
npm run pomodoro          # start the app
npm run pomodoro:install  # install deps
npm run pomodoro:build    # build portable
```

## Architecture

### Electron Security Model
The app uses **context isolation** with a preload bridge — `nodeIntegration` is off. `preload.js` exposes a `window.pomodoro` API via `contextBridge.exposeInMainWorld()` with exactly four IPC methods. All main↔renderer communication goes through this narrow bridge; do not add `nodeIntegration: true`.

### IPC Channels (Main Process ↔ Renderer)
| Channel | Direction | Purpose |
|---|---|---|
| `set-always-on-top` | renderer → main | Toggle window pinning |
| `show-notification` | renderer → main | Trigger OS desktop notification |
| `minimize-to-tray` | renderer → main | Hide window to system tray |
| `get-app-version` | renderer → main | Read Electron app version |

### Renderer State Machine
The renderer (`app.js`) manages timer state with a three-phase, three-status model:
- **Phases:** `work` → `shortBreak` / `longBreak` (auto-switched on timer completion)
- **Statuses:** `idle` → `running` → `paused` (user-driven)
- Long break triggers when `completedToday % longBreakInterval === 0`

### Data Persistence
All state is client-side only, using `localStorage`:
- `pomodoro-settings` — duration config, sound/notification toggles
- `pomodoro-stats` — `{ date, count }` resets daily via `new Date().toDateString()` comparison

### Window Lifecycle
- Closing the window hides to tray instead of quitting (`mainWindow.on('close')` prevents default unless `isQuitting` is true)
- The tray icon is generated programmatically as a 16×16 RGBA buffer (no external icon file needed for tray)
- macOS activate event re-shows or re-creates the window

### Build Configuration
`electron-builder` config is in `pomodoro/package.json` (not a separate file). Targets Windows portable + NSIS installer. Output goes to `pomodoro/dist/`. The `files` whitelist includes only `main.js`, `preload.js`, `renderer/**/*`, and `assets/**/*`.
