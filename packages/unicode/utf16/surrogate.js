export function isHighSurrogate(value) {
  return value >= 0xd800 && value <= 0xdbff
}

export function isLowSurrogate(value) {
  return value >= 0xdc00 && value <= 0xdfff
}

export function decodeSurrogatePair(high, low) {
  if (!isHighSurrogate(high))
    throw new Error('Expected UTF-16 high surrogate.')
  if (!isLowSurrogate(low))
    throw new Error('Expected UTF-16 low surrogate.')

  return 0x10000
    + (((high - 0xd800) << 10) | (low - 0xdc00))
}

