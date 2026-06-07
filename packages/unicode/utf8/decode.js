import { assertScalarValue } from '../scalar.js'
import { utf8ContinuationCount } from './byte.js'

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

function assertShortestUtf8Sequence(value, count) {
  if (count == 1 && value < 0x80)
    throw new Error('Overlong UTF-8 sequence.')
  if (count == 2 && value < 0x800)
    throw new Error('Overlong UTF-8 sequence.')
  if (count == 3 && value < 0x10000)
    throw new Error('Overlong UTF-8 sequence.')
}

