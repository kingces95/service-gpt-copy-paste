import {
  decodeBytes,
  normalizeByteOrder,
} from '../byte-order.js'

export function decodeUtf16CodeUnit(bytes, byteOrder = 'wire') {
  if (bytes.length != 2)
    throw new Error('Expected two bytes for a UTF-16 code unit.')

  return decodeBytes(bytes, normalizeByteOrder(byteOrder))
}

