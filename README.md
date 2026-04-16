# BodyTrace

Visual fitness journal (React Native + Expo + TypeScript). Local-first MVP with a ghost-overlay camera for aligned progress photos.

## Scripts

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` — run on device/emulator

## Structure

- `app/` — Expo Router (`(tabs)` home, camera, compare, settings; `entry/[id]` detail)
- `components/` — UI, timeline, camera overlay (ghost, grid, opacity)
- `contexts/` — `EntriesProvider` + mock data
- `types/` — shared TypeScript models

## Ghost camera

The overlay is implemented as siblings of `CameraView` (`expo-camera` does not support children): reference image + alignment grid sit above the preview with absolute positioning. Use **Expo Go** on a physical device for the camera tab; web shows a placeholder.
