import { describe, expect, it } from 'vitest'
import { from, lastValueFrom, toArray } from 'rxjs'
import { TypedArrayView } from '@kingjs/cursor-view'
import { encodeUtf16Bytes, Utf16ByteOrderMarks } from '@kingjs/unicode'
import {
  activateUnicode,
  decodeUnicode,
  splitOnCodePoints,
} from './index.js'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

describe('cursor-container-unicode-rx', () => {
  it('activates, splits, and decodes a chunked Unicode stream', async () => {
    const first = 'alpha\n'
    const second = 'beta'
    const bytes = Uint8Array.from([
      ...Utf16ByteOrderMarks.little,
      ...encodeUtf16Bytes([...first, ...second].map(c => c.codePointAt()),
        'little'),
    ])

    const chunks = [
      rangeOf(bytes.subarray(0, 3)),
      rangeOf(bytes.subarray(3, 9)),
      rangeOf(bytes.subarray(9)),
    ]

    const lines = await lastValueFrom(from(chunks).pipe(
      activateUnicode({ requirePreamble: true }),
      splitOnCodePoints('\n'),
      decodeUnicode(),
      toArray(),
    ))

    expect(lines).toEqual(['alp', 'ha'])
  })
})
