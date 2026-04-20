# Expo / React Native upgrade checklist

Use when moving to a new **Expo SDK** or **React Native** minor/major. Detailed steps: [.cursor/skills/agent-skills/skills/upgrading-react-native/SKILL.md](../.cursor/skills/agent-skills/skills/upgrading-react-native/SKILL.md) and the official Expo upgrade guide for your target SDK.

## Before you start

1. **Branch** off `main` (e.g. `chore/expo-sdk-NN`).
2. Read **Expo changelog** and **React Native release notes** for breaking changes affecting: `expo-router`, `expo-notifications`, `nativewind`, `reanimated`, `sqlite`, `camera`.

## Dependency alignment

1. Run `npx expo install expo@~<target>` and `npx expo install --fix` so Expo packages match the SDK.
2. Resolve peer dependency warnings; run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:ci`.

## EAS CLI alignment

- [`eas.json`](../eas.json) **`cli.version`** must be compatible with the EAS CLI you use locally and in CI.
- [`.github/workflows/eas-build.yml`](../.github/workflows/eas-build.yml) **`eas-version`** on `expo/expo-github-action` should match the same pinned CLI (e.g. `18.7.0` or newer after you verify with `npm view eas-cli version`).

## Verify

1. **Local:** `npx expo start`, exercise timeline, new entry, camera, settings, reminders (dev build for notifications).
2. **EAS:** Preview **Android** (and **iOS** if configured) build; run **OTA** to a **preview/staging** channel before production.
3. **OTA runtime:** Confirm `runtimeVersion` / `expo-updates` behavior still matches your release policy in `app.json`.

## If something breaks

- Compare with **rn-diff-purge** or Expo’s template diff for the target version.
- Re-run `npx expo-doctor` after upgrades.
