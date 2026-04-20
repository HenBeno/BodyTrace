const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// expo-sqlite on web imports wa-sqlite.wasm; EAS Update / `expo export --platform=all`
// must treat .wasm as a static asset or Metro cannot resolve the import.
const { assetExts } = config.resolver
if (!assetExts.includes("wasm")) {
  config.resolver.assetExts = [...assetExts, "wasm"]
}

module.exports = withNativeWind(config, { input: "./global.css" })
