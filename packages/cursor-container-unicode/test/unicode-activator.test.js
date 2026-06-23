import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  UnicodeActivator,
  Utf16LECodePointContainer,
  Utf32LECodePointContainer,
  Utf8CodePointContainer,
} from '../index.js'
import {
  Utf16ByteOrderMarks,
  Utf32ByteOrderMarks,
  Utf8Signature,
  encodeUtf16Bytes,
  encodeUtf32Bytes,
} from '@kingjs/unicode'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('UnicodeActivator', () => {
  it('waits while UTF-16LE could still be UTF-32LE', () => {
    const activator = new UnicodeActivator()

    expect(activator.pushRange(rangeOf(Utf16ByteOrderMarks.little)))
      .toBe(null)
  })

  it('activates UTF-32LE when the longer preamble matches', () => {
    const activator = new UnicodeActivator()
    const bytes = [
      ...Utf32ByteOrderMarks.little,
      ...encodeUtf32Bytes([0x61], 'little'),
    ]

    const input = activator.pushRange(rangeOf(bytes))

    expect(input).toBeInstanceOf(Utf32LECodePointContainer)
    expect(valuesOf(input)).toEqual([0x61])
  })

  it('activates UTF-16LE after the UTF-32LE preamble misses', () => {
    const activator = new UnicodeActivator()
    const bytes = [
      ...Utf16ByteOrderMarks.little,
      ...encodeUtf16Bytes([0x61], 'little'),
    ]

    const input = activator.pushRange(rangeOf(bytes))

    expect(input).toBeInstanceOf(Utf16LECodePointContainer)
    expect(valuesOf(input)).toEqual([0x61])
  })

  it('activates the default encoding when no preamble matches', () => {
    const activator = new UnicodeActivator({
      defaultEncoding: 'utf8',
    })

    const input = activator.pushRange(rangeOf([0x61]))

    expect(input).toBeInstanceOf(Utf8CodePointContainer)
    expect(valuesOf(input)).toEqual([0x61])
  })

  it('requires a preamble when requested', () => {
    const activator = new UnicodeActivator({
      defaultEncoding: 'utf8',
      requirePreamble: true,
    })

    expect(() => activator.pushRange(rangeOf([0x61])))
      .toThrow('Unicode preamble is required.')
  })

  it('forwards ranges after activation', () => {
    const activator = new UnicodeActivator()
    const input = activator.pushRange(rangeOf([
      ...Utf8Signature.signature,
      0x61,
    ]))

    const forwarded = activator.pushRange(rangeOf([0x62]))

    expect(forwarded).toBe(input)
    expect(valuesOf(input)).toEqual([0x61, 0x62])
  })
})
