# BodyTrace — agent context

This app uses **Expo SDK 54**, **expo-router**, **NativeWind**, **EAS Update**, and **EAS Build** (see `package.json`, `app.json`, and `eas.json`).

## Vendored skills (read `SKILL.md` first)

Callstack **agent-skills** are vendored under `.cursor/skills/agent-skills/skills/`. Open the matching **`SKILL.md`**, then follow links into that skill’s `references/` folder.

| When you are doing…                                            | Start here                                                                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance, jank, lists, bundle size, TTI, memory, animations | [.cursor/skills/agent-skills/skills/react-native-best-practices/SKILL.md](.cursor/skills/agent-skills/skills/react-native-best-practices/SKILL.md)             |
| GitHub PRs, `gh` CLI, review, branching                        | [.cursor/skills/agent-skills/skills/github/SKILL.md](.cursor/skills/agent-skills/skills/github/SKILL.md)                                                       |
| CI: Actions, simulators, emulator artifacts                    | [.cursor/skills/agent-skills/skills/github-actions/SKILL.md](.cursor/skills/agent-skills/skills/github-actions/SKILL.md)                                       |
| React Native / Expo version upgrades                           | [.cursor/skills/agent-skills/skills/upgrading-react-native/SKILL.md](.cursor/skills/agent-skills/skills/upgrading-react-native/SKILL.md)                       |
| Brownfield RN / Expo adoption in native apps                   | [.cursor/skills/agent-skills/skills/react-native-brownfield-migration/SKILL.md](.cursor/skills/agent-skills/skills/react-native-brownfield-migration/SKILL.md) |

## Performance workflow

For runtime performance work, follow **measure → optimize → re-measure**. Prefer profiler evidence over speculative memoization or micro-optimizations.

- Checklist and repo-specific notes: [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

## Expo / React Native upgrades

When bumping SDK or RN versions, use [docs/UPGRADE.md](docs/UPGRADE.md) and keep `eas.json` **`cli.version`** in sync with [`.github/workflows/eas-build.yml`](.github/workflows/eas-build.yml) **`eas-version`**.
