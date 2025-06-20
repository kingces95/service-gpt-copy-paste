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

export function* starsAndBars(stars, bars, options = {}) {
  const minStars = options.minStars ?? 0
  const n = stars + bars
  const indices = Array.from({ length: bars }, (_, i) => i)

  function* combinations(start, depth, path) {
    if (depth === 0) {
      yield path
      return
    }
    for (let i = start; i <= n - depth; i++) {
      yield* combinations(i + 1, depth - 1, [...path, i])
    }
  }

  for (const barPositions of combinations(0, bars, [])) {
    const result = []
    let prev = -1
    for (const bar of barPositions) {
      result.push(bar - prev - 1)
      prev = bar
    }
    result.push(n - prev - 1)

    if (result.every(starCount => starCount >= minStars)) {
      yield result
    }
  }
}