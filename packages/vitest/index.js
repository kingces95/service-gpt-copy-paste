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

export function toText(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()))
    stream.on('error', reject)
  })
}

export async function toBeDecodedAs(stream, expected) {
  const text = await toText(stream)
  const pass = text === expected
  return {
    pass,
    message: () => `Expected stream to decode as "${expected}" but got "${text}"`
  }
}
