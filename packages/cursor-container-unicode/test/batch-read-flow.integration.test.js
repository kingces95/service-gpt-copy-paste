import { describe, expect, it } from 'vitest'
import { VirtualContainer } from '@kingjs/cursor-virtual'
import { retreat } from '@kingjs/cursor-algorithm'
import {
  UnicodeEncoding,
  Utf8Signature,
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'
import { PreambleScanner } from '../index.js'

const Delimiter = '😀'
const Prefix = 'alpha'
const Suffix = 'beta'
const Preambles = {
  'utf-8': Utf8Signature.signature,
  'utf-16be': Utf16ByteOrderMarks.big,
  'utf-16le': Utf16ByteOrderMarks.little,
}

function concatBytes(...spans) {
  const size = spans.reduce((total, span) => total + span.length, 0)
  const result = new Uint8Array(size)
  let offset = 0

  for (const span of spans) {
    result.set(span, offset)
    offset += span.length
  }

  return result
}

function chunksOf({ encoding, preamble }) {
  const unicode = UnicodeEncoding.from(encoding)
  const prefix = unicode.encodeString(Prefix)
  const delimiter = unicode.encodeString(Delimiter)
  const suffix = unicode.encodeString(Suffix)

  if (preamble.length == 0)
    return [
      concatBytes(prefix, delimiter.subarray(0, 1)),
      concatBytes(delimiter.subarray(1), suffix),
    ]

  return [
    preamble.subarray(0, 1),
    concatBytes(
      preamble.subarray(1),
      prefix,
      delimiter.subarray(0, 1)
    ),
    concatBytes(delimiter.subarray(1), suffix),
  ]
}

function decodeRange(range, encoding) {
  return UnicodeEncoding.from(encoding).decodeChunks(range.spans())
}

describe('Unicode-aware batch read flow', () => {
  it.each([
    ['UTF-8 default', 'utf-8', Uint8Array.of()],
    ['UTF-8 signature', 'utf-8', Uint8Array.from(Utf8Signature.signature)],
    ['UTF-16BE BOM', 'utf-16be', Uint8Array.from(Utf16ByteOrderMarks.big)],
    ['UTF-16LE BOM', 'utf-16le', Uint8Array.from(Utf16ByteOrderMarks.little)],
  ])('%s lowers a delimiter and commits exact bytes', (
    name,
    expectedEncoding,
    preamble
  ) => {
    const chunks = chunksOf({
      encoding: expectedEncoding,
      preamble,
    })
    const scanner = new PreambleScanner({
      sequences: Preambles,
      defaultMetadata: 'utf-8',
    })
    let result = scanner.pushBytes(chunks[0])

    if (!result)
      result = scanner.pushBytes(chunks[1])

    const encoding = result.key
    const input = result.data
    const needle = UnicodeEncoding.from(encoding).encodeString(Delimiter)

    expect(encoding).toBe(expectedEncoding)
    expect(input.popRange(needle)).toBe(null)

    input.pushBytes(chunks[chunks.length - 1])

    const committed = input.popRange(needle)

    expect(decodeRange(committed, encoding)).toBe(`${Prefix}${Delimiter}`)
    expect(decodeRange(input, encoding)).toBe(Suffix)
  })

  it('can exclude the lowered delimiter from the committed range', () => {
    const encoding = 'utf-16le'
    const input = new VirtualContainer()
    const needle = UnicodeEncoding.from(encoding).encodeString(Delimiter)

    for (const chunk of chunksOf({
      encoding,
      preamble: Uint8Array.of(),
    }))
      input.pushBytes(chunk)

    let committed = input.popRange(needle)
    committed = committed.popRangeAt(
      retreat(committed.end(), needle.length))

    expect(decodeRange(committed, encoding)).toBe(Prefix)
    expect(decodeRange(input, encoding)).toBe(Suffix)
  })
})
