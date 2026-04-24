# BodyTrace

**BodyTrace** is a local-first visual fitness journal for React Native. Capture progress photos from consistent angles (front, side, back), log body measurements, and compare entries over time—with optional biometric lock and on-device photo protection.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Account (Supabase)](#account-supabase)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Camera and ghost overlay](#camera-and-ghost-overlay)
- [Platform notes](#platform-notes)
- [Privacy and security](#privacy-and-security)
- [Scripts reference](#scripts-reference)
- [License](#license)

---

## Features

- **Timeline** — Chronological list of entries with photos and measurement summaries.
- **Ghost camera** — Semi-transparent reference (“ghost”) image and alignment guides so new shots match a chosen baseline pose.
- **Measurements** — Optional circumference and weight fields per entry (metric/imperial).
- **Compare** — Side-by-side and slider-style comparisons between two points in time.
- **Entry detail** — View and edit a single entry (`app/entry/`).
- **Settings** — Reminder preferences (frequency, day), biometric gate toggle, and related app options.
- **Biometric gate** — When enabled, Face ID / Touch ID (or platform equivalent) is required after cold start and when returning from background (`SecurityGate`).
- **Local persistence** — SQLite for metadata; photos stored under the app sandbox with optional NaCl secretbox encryption on native.
- **Account + onboarding** — Email/password via Supabase Auth; required profile onboarding (incl. BMI) before using the app; profile row stored in Supabase (`profiles`).

---

## Tech stack

| Area             | Technology                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | [Expo](https://expo.dev/) ~54, [React Native](https://reactnative.dev/) 0.81                                                                                                          |
| Language         | TypeScript                                                                                                                                                                            |
| Navigation       | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes)                                                                                                  |
| Styling          | [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS)                                                                                                                           |
| Icons            | [Lucide React Native](https://lucide.dev/)                                                                                                                                            |
| State            | React Context (`AuthContext`, `EntriesContext`, `SettingsContext`)                                                                                                                    |
| Auth / backend   | [Supabase](https://supabase.com/) Auth + Postgres (`profiles` table)                                                                                                                  |
| Database         | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)                                                                                                                      |
| Camera           | [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)                                                                                                                      |
| Crypto / secrets | [expo-crypto](https://docs.expo.dev/versions/latest/sdk/crypto/), [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/), [TweetNaCl](https://tweetnacl.js.org/) |
| Biometrics       | [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)                                                                                          |
| Notifications    | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)                                                                                                        |

The app targets the **New Architecture** (`newArchEnabled` in `app.json`).

---

## Requirements

- **Node.js** — LTS (e.g. 20.x or 22.x) recommended.
- **npm** (or compatible client) for dependencies.
- For **iOS**: Xcode and a simulator or physical device (camera on real hardware).
- For **Android**: Android Studio / SDK and an emulator or device.
- **Physical device** recommended for the Camera tab (see [Platform notes](#platform-notes)).

---

## Getting started

Clone the repository, install dependencies, and start the Expo dev server:

```bash
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with **Expo Go** on a phone.

To open a specific platform directly:

```bash
npm run ios
npm run android
npm run web
```

---

## Account (Supabase)

BodyTrace requires a Supabase project for email/password sign-in and the `profiles` table used during onboarding.

1. Create a Supabase project and copy the **Project URL** + **anon public key**.
2. Copy [`.env.example`](.env.example) to `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. In the Supabase SQL editor, run the migrations (in order):
   - [`supabase/migrations/20260424120000_profiles.sql`](supabase/migrations/20260424120000_profiles.sql) — `profiles` + RLS.
   - [`supabase/migrations/20260424180000_journal_entries_and_storage.sql`](supabase/migrations/20260424180000_journal_entries_and_storage.sql) — `journal_entries` table, private `entry-photos` bucket, and Storage RLS (timeline sync MVP).
4. If email confirmation is enabled in Supabase Auth, new users must confirm email before a session is created.

Restart Expo after changing env vars.

---

## Project structure

```
bodytrace/
├── app/                      # Expo Router screens
│   ├── (tabs)/               # Tab navigator: home, camera, compare, settings
│   ├── entry/                # Stack: new entry, entry detail [id]
│   ├── (auth)/               # Email login + signup
│   ├── (onboarding)/         # Required profile + BMI onboarding
│   └── _layout.tsx           # Root: fonts, theme, providers, navigation gate
├── components/               # Reusable UI
│   ├── auth/                 # SecurityGate, redirects, root navigation shell
│   ├── camera/               # Ghost overlay, alignment, controls
│   ├── comparison/           # Side-by-side, slider
│   ├── measurements/         # Body measurement UI
│   ├── media/                # Image resolution helpers
│   ├── timeline/             # Timeline list / cards
│   └── ui/                   # Buttons, cards, headers, etc.
├── contexts/                 # AuthProvider, EntriesProvider, SettingsProvider
├── hooks/                    # Camera, entries, secure storage, photo URIs
├── services/                 # database, profileRepository, encryption, mediaStore, biometric, export, reminders
├── types/                    # Shared TypeScript models (Entry, AppSettings, …)
├── utils/                    # Theme, navigation helpers, constants, measurements
├── assets/                   # Images, fonts
├── app.json                  # Expo config, plugins, permissions copy
├── global.css                # Tailwind / NativeWind entry
└── tailwind.config.js
```

---

## Architecture

- **UI layer** — Tab screens and entry stack consume context hooks; no global Redux store.
- **Entries flow** — `EntriesProvider` loads data after `ensureInitialized()` (SQLite schema + crypto keys on native). Adding an entry persists photos via `mediaStore`, then writes rows through `database` service.
- **Settings flow** — `SettingsProvider` supplies reminder and biometric flags used by `SecurityGate` and scheduling logic.
- **Ghost reference** — Context exposes helpers (e.g. ghost URI per angle) so the camera can overlay the last or chosen baseline image.

Data stays **on the device** by default; there is no bundled cloud sync in this repository.

---

## Camera and ghost overlay

`expo-camera`’s `CameraView` does not support arbitrary children as an overlay layer. BodyTrace implements the ghost and alignment UI as **siblings** of the preview, absolutely positioned on top, with an opacity control for the reference image.

For reliable camera access during development, use a **physical device** with Expo Go. The web build may show placeholders or limited camera behavior.

---

## Platform notes

| Platform          | Notes                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iOS / Android** | Full camera, SQLite, SecureStore, biometrics, sharing, and encrypted photo paths as implemented.                                                   |
| **Web**           | Useful for UI development; `EntriesContext` may keep entries in memory only for add flows; camera and some native features are limited or stubbed. |

Always verify permission strings in `app.json` before shipping to stores.

---

## Privacy and security

- **Biometrics** — Optional; when on, the app locks on background and requires local authentication to continue.
- **Secrets** — Device-bound material and photo encryption keys are stored with `expo-secure-store` (keychain / Keystore).
- **Photos** — Native builds can persist encrypted blobs; export/share paths decrypt to a temporary file when needed (`export` service).

This is **not** a HIPAA or medical-device certification statement—treat the app as a personal journal and review data handling for your own compliance needs.

---

## Scripts reference

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm start`       | Start Expo Metro / dev tools      |
| `npm run ios`     | Start dev server and open iOS     |
| `npm run android` | Start dev server and open Android |
| `npm run web`     | Start dev server for web          |

---

## License

This project is marked **private** in `package.json`. Add a `LICENSE` file and update this section if you open-source the repository.
