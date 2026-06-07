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

export function encodeUtf16Sequence(values) {
  const result = []

  for (const value of values) {
    assertScalarValue(value)

    if (value <= 0xffff) {
      result.push(value)
      continue
    }

    const offset = value - 0x10000
    result.push(0xd800 + (offset >> 10))
    result.push(0xdc00 + (offset & 0x3ff))
  }

  return result
}

export function encodeUtf16Bytes(values, byteOrder = 'wire') {
  return encodeUnitsAsBytes(
    encodeUtf16Sequence(values),
    2,
    normalizeByteOrder(byteOrder)
  )
}

export function encodeUtf32Bytes(values, byteOrder = 'wire') {
  for (const value of values)
    assertScalarValue(value)

  return encodeUnitsAsBytes(values, 4, normalizeByteOrder(byteOrder))
}

export function decodeUtf16CodeUnit(bytes, byteOrder = 'wire') {
  if (bytes.length != 2)
    throw new Error('Expected two bytes for a UTF-16 code unit.')

  return decodeBytes(bytes, normalizeByteOrder(byteOrder))
}

export function decodeUtf32CodeUnit(bytes, byteOrder = 'wire') {
  if (bytes.length != 4)
    throw new Error('Expected four bytes for a UTF-32 code unit.')

  return decodeBytes(bytes, normalizeByteOrder(byteOrder))
}

export function normalizeByteOrder(byteOrder = 'wire') {
  switch (byteOrder) {
    case 'wire':
    case 'big':
      return 'big'
    case 'little':
      return 'little'
    case 'native':
      return NativeByteOrder
  }

  throw new Error('Unknown byte order.')
}

export function utf8ContinuationCount(first) {
  if (first <= 0x7f) return 0
  if (first >= 0xc2 && first <= 0xdf) return 1
  if (first >= 0xe0 && first <= 0xef) return 2
  if (first >= 0xf0 && first <= 0xf4) return 3

  throw new Error('Invalid UTF-8 leading byte.')
}

export function utf8LastCodePointOffset(suffix) {
  if (suffix.length == 0)
    return 0

  let index = suffix.length - 1
  while (index >= 0 && isUtf8ContinuationByte(suffix[index]))
    index--

  if (index < 0)
    throw new Error('Invalid UTF-8 continuation byte.')

  const count = utf8ContinuationCount(suffix[index])
  const available = suffix.length - index - 1
  if (available > count)
    throw new Error('Invalid UTF-8 continuation byte.')
  if (available < count)
    return index == 0 ? null : index

  const parts = suffix
    .slice(index + 1)
    .map(utf8ContinuationPayload)
  decodeUtf8Sequence(suffix[index], parts)
  return suffix.length
}

export function utf8ContinuationPayload(byte) {
  if (!isUtf8ContinuationByte(byte))
    throw new Error('Invalid UTF-8 continuation byte.')

  return byte & 0x3f
}

export function decodeUtf8Sequence(first, parts = []) {
  const count = utf8ContinuationCount(first)
  if (parts.length != count)
    throw new Error('Unexpected UTF-8 continuation count.')

  let value
  switch (count) {
    case 0:
      value = first
      break
    case 1:
      value = ((first & 0x1f) << 6) | parts[0]
      break
    case 2:
      value = ((first & 0x0f) << 12)
        | (parts[0] << 6)
        | parts[1]
      break
    case 3:
      value = ((first & 0x07) << 18)
        | (parts[0] << 12)
        | (parts[1] << 6)
        | parts[2]
      break
  }

  assertShortestUtf8Sequence(value, count)
  assertScalarValue(value)
  return value
}

export function utf16LastCodePointOffset(suffix) {
  if (suffix.length == 0)
    return 0

  const last = suffix.at(-1)
  if (isHighSurrogate(last))
    return suffix.length == 1 ? null : suffix.length - 1

  if (isLowSurrogate(last)) {
    if (suffix.length < 2 || !isHighSurrogate(suffix.at(-2)))
      throw new Error('Unexpected UTF-16 low surrogate.')

    return suffix.length
  }

  if (suffix.length >= 2 && isHighSurrogate(suffix.at(-2)))
    throw new Error('Expected UTF-16 low surrogate.')

  return suffix.length
}

export function isUtf8ContinuationByte(byte) {
  return (byte & 0xc0) == 0x80
}

const NativeByteOrder = (() => {
  const bytes = new Uint8Array(new Uint16Array([1]).buffer)
  return bytes[0] == 1 ? 'little' : 'big'
})()

function decodeBytes(bytes, byteOrder) {
  let value = 0
  const ordered = byteOrder == 'big'
    ? bytes
    : [...bytes].reverse()

  for (const byte of ordered)
    value = value * 0x100 + byte

  return value
}

function encodeUnitsAsBytes(values, width, byteOrder) {
  const result = []

  for (const value of values) {
    const bytes = []
    let current = value

    for (let i = 0; i < width; i++) {
      bytes.unshift(current % 0x100)
      current = Math.floor(current / 0x100)
    }

    result.push(...(byteOrder == 'big' ? bytes : bytes.reverse()))
  }

  return result
}

function assertShortestUtf8Sequence(value, count) {
  if (count == 1 && value < 0x80)
    throw new Error('Overlong UTF-8 sequence.')
  if (count == 2 && value < 0x800)
    throw new Error('Overlong UTF-8 sequence.')
  if (count == 3 && value < 0x10000)
    throw new Error('Overlong UTF-8 sequence.')
}
