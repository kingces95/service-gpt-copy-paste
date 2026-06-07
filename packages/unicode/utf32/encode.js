import {
  encodeUnitsAsBytes,
  normalizeByteOrder,
} from '../byte-order.js'
import { assertScalarValue } from '../scalar.js'

export function encodeUtf32Bytes(values, byteOrder = 'wire') {
  for (const value of values)
    assertScalarValue(value)

  return encodeUnitsAsBytes(values, 4, normalizeByteOrder(byteOrder))
}

