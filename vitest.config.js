import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // Enables global variables like `describe` and `test`
    environment: 'node', // Sets the testing environment (e.g., 'jsdom' for browser-like environment)
    coverage: {
      provider: 'v8', // Use V8 for coverage
      reporter: ['text', 'html', 'lcov'], // Generate text, HTML, and lcov reports
      all: true, // Include files without tests in the coverage report
      reportsDirectory: './coverage', // Ensure the reports go to your `coverage` folder
    },
  },
})
