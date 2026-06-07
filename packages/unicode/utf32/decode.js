import {
  decodeBytes,
  normalizeByteOrder,
} from '../byte-order.js'

export function decodeUtf32CodeUnit(bytes, byteOrder = 'wire') {
  if (bytes.length != 4)
    throw new Error('Expected four bytes for a UTF-32 code unit.')

  return decodeBytes(bytes, normalizeByteOrder(byteOrder))
}

