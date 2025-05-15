import { defineConfig } from 'vitest/config'
// import path from 'node:path'

export default defineConfig({
  test: {
    workspace: [ 'packages/*' ], // Specify the workspace root
    // include: ['packages/**/unit.test.js'], // Or whatever pattern matches your real test files
    // exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],

    // globals: true, // Enables global variables like `describe` and `test`
    environment: 'node', // Sets the testing environment (e.g., 'jsdom' for browser-like environment)
    coverage: {
      // provider: 'v8', // Use V8 for coverage
      // reporter: ['text', 'html', 'lcov'], // Generate text, HTML, and lcov reports
      // all: true, // Include files without tests in the coverage report
      // include: ['packages/**/index.js'],
      // exclude: ['**/test.js', '**/*.test.js', '**/node_modules/**'],
      // reportsDirectory: path.resolve(__dirname, 'coverage')
    },
  },
})
