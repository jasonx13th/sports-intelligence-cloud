/**
 * Test-only helper to reduce noisy console output.
 * Default: silence console.* during tests
 * Opt-in verbose: TEST_VERBOSE=1
 *
 * Non-goal: change runtime logging. This file is only imported by the test script.
 */
if (process.env.TEST_VERBOSE === "1") {
  // Allow full console output when debugging locally/CI.
  // eslint-disable-next-line no-useless-return
  return;
}

// Replace console methods with no-ops to keep test output readable.
console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.error = () => {};
