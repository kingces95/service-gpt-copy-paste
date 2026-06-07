import {
  isHighSurrogate,
  isLowSurrogate,
} from './surrogate.js'

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

