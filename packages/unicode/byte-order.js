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

export function assertByteOrder(byteOrder) {
  if (byteOrder == 'big' || byteOrder == 'little')
    return

  throw new Error('Byte order must be big or little.')
}

export function decodeBytes(bytes, byteOrder) {
  assertByteOrder(byteOrder)

  let value = 0
  const ordered = byteOrder == 'big'
    ? bytes
    : [...bytes].reverse()

  for (const byte of ordered)
    value = value * 0x100 + byte

  return value
}

export function decodeUint16(bytes, byteOrder) {
  if (bytes.length != 2)
    throw new Error('Expected two bytes for a Uint16.')

  return decodeBytes(bytes, byteOrder)
}

export function decodeUint32(bytes, byteOrder) {
  if (bytes.length != 4)
    throw new Error('Expected four bytes for a Uint32.')

  return decodeBytes(bytes, byteOrder)
}

export function encodeUnitsAsBytes(values, width, byteOrder) {
  assertByteOrder(byteOrder)

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

export const NativeByteOrder = (() => {
  const bytes = new Uint8Array(new Uint16Array([1]).buffer)
  return bytes[0] == 1 ? 'little' : 'big'
})()
