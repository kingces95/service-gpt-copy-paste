import {
  isUtf8ContinuationByte,
  utf8ContinuationCount,
  utf8ContinuationPayload,
} from './byte.js'
import { decodeUtf8Sequence } from './decode.js'

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

