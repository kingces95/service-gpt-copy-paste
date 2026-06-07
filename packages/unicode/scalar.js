export function isScalarValue(value) {
  return Number.isInteger(value)
    && value >= 0
    && value <= 0x10ffff
    && !isSurrogate(value)
}

export function assertScalarValue(value) {
  if (!Number.isInteger(value))
    throw new Error('Unicode code point must be an integer.')
  if (value < 0 || value > 0x10ffff)
    throw new Error('Unicode code point is out of range.')
  if (isSurrogate(value))
    throw new Error('Unicode surrogate code point is invalid.')
}

export function isSurrogate(value) {
  return value >= 0xd800 && value <= 0xdfff
}

