export function utf8ContinuationCount(first) {
  if (first <= 0x7f) return 0
  if (first >= 0xc2 && first <= 0xdf) return 1
  if (first >= 0xe0 && first <= 0xef) return 2
  if (first >= 0xf0 && first <= 0xf4) return 3

  throw new Error('Invalid UTF-8 leading byte.')
}

export function utf8ContinuationPayload(byte) {
  if (!isUtf8ContinuationByte(byte))
    throw new Error('Invalid UTF-8 continuation byte.')

  return byte & 0x3f
}

export function isUtf8ContinuationByte(byte) {
  return (byte & 0xc0) == 0x80
}

