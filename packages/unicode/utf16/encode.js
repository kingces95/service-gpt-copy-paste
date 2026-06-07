import {
  encodeUnitsAsBytes,
  normalizeByteOrder,
} from '../byte-order.js'
import { assertScalarValue } from '../scalar.js'

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

