export function toBeEquals(received, expected) {
  const pass = typeof received?.equals === 'function' && received.equals(expected);
  return {
    pass,
    message: () =>
      `expected ${received} to equal ${expected}`
  }
}

export function toBeEmptyString(received) {
  const pass = typeof received === 'string' && received.length === 0;
  return {
    pass,
    message: () =>
      `expected ${received} to be an empty string`
  }
}
