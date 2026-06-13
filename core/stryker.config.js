/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  testRunner: "jest",
  jest: {
    configFile: "jest.config.js",
  },
  mutate: [
    "src/**/*.ts",
    "!src/__tests__/**/*.ts",
    "!src/index.ts",        // composition root — not logic
    "!src/providers/**",    // covered via provider-level tests
  ],
  thresholds: {
    high: 75,
    low: 60,
    break: 50,
  },
  reporters: ["html", "clear-text", "progress"],
  htmlReporter: {
    fileName: "reports/mutation/report.html",
  },
  timeoutMS: 10000,
  concurrency: 4,
};
