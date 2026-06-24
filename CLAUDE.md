# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                          # Start Expo dev server
npm run android                    # Start with Android emulator
npm run build:android              # Trigger EAS APK build (requires eas-cli login)
eas build --platform android --profile preview   # Build preview APK
eas build --platform android --profile production # Build production APK
```

There is no test suite or linter configured.

## Firebase Setup

`src/config/firebase.js` contains placeholder Firebase credentials. Replace with real values from the Firebase console before the app can connect to Firestore or Storage. `google-services.json` is gitignored — download from Firebase and place at the repo root for native builds.

The Firestore collection is `simulations`. Each document has: `title`, `std`, `subject`, `description`, `htmlUrl`, `fileType` (`'html'` or `'tsx'`), `requiresInternet`, `addedAt`.

## Architecture

**Navigation stack** (App.js): Home → SimulationList → SimulationView, plus Admin as a hidden route.

**Admin access**: Tapping the home banner 5 times opens a PIN modal (default PIN: `1234`, stored in AsyncStorage via `src/utils/pinStorage.js`). Admin can upload HTML/TSX files and delete simulations.

**Simulation rendering** (`src/screens/SimulationViewScreen.js`):
- HTML files are fetched from Firebase Storage and rendered directly in a sandboxed WebView.
- TSX files go through `buildTsxHtml()`, which:
  1. Converts known ES module imports to `window` global destructuring (e.g. `import { Check } from 'lucide-react'` → `const { Check } = window.lucideReact || {}`). Unknown imports are stripped.
  2. Strips `export` declarations.
  3. Wraps the cleaned code in a full HTML document that loads React 18, Babel Standalone, Tailwind Play CDN, and UMD builds of lucide-react, recharts, framer-motion, d3, and KaTeX via unpkg.
  4. Babel compiles the code in-browser using `data-presets="react,typescript"`.
  5. Expects the TSX file to export a component named `App` as its default/main export.
  6. Shows a red error panel (instead of white screen) on any runtime or render error.

`MODULE_TO_GLOBAL` at the top of `SimulationViewScreen.js` is the canonical map of npm package names to their UMD window globals — extend it when adding support for new libraries.

**Filter constants** (`src/constants/filters.js`): All valid `std` and `subject` values used by both AdminScreen and SimulationListScreen live here, along with per-subject hex colors used in SimulationCard.

**WebView protection**: `PROTECTION_JS` in `SimulationViewScreen.js` is injected before content loads to disable right-click, text selection, F12, and Ctrl+U/S. `onShouldStartLoadWithRequest` blocks top-frame navigation away from `https://localhost`.

## Build Notes

EAS builds require `NPM_CONFIG_LEGACY_PEER_DEPS=true` (set in `eas.json`) due to peer dependency conflicts in the Expo 51 dependency tree. The app targets Android only; iOS is not configured.
