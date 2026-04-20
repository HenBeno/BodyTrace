/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  // Do not add "/.cursor/" here — dev machines often live under a parent ".cursor" folder and Jest would skip all tests.
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/stitch_bodytrace_private_fitness_journal/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/dist-web/"],
}
