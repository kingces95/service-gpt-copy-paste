export function assert(condition, message) {
  if (!condition) throw new Error(
    `Assertion failed: ${message ?? 'Condition is false'}`)
}