import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { PreambleScanner } from '../index.js'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('PreambleScanner', () => {
  it('waits while a preamble can still match', () => {
    let called = false
    const scanner = new PreambleScanner({
      sequences: {
        signature: [0xef, 0xbb, 0xbf],
      },
      onPreamble() { called = true },
    })

    scanner.pushRange(rangeOf([0xef]))
    scanner.pushRange(rangeOf([0xbb]))

    expect(called).toBe(false)
  })

  it('resolves a matched preamble and remainder', () => {
    let result = null
    const scanner = new PreambleScanner({
      sequences: {
        big: [0xfe, 0xff],
        little: [0xff, 0xfe],
      },
      onPreamble(value) { result = value },
    })

    scanner.pushRange(rangeOf([0xfe]))
    scanner.pushRange(rangeOf([0xff, 0x00, 0x61]))

    expect(result.match).toBe('big')
    expect(valuesOf(result.preamble)).toEqual([0xfe, 0xff])
    expect(valuesOf(result.remainder)).toEqual([0x00, 0x61])
  })

  it('resolves with no preamble once no sequence can match', () => {
    let result = null
    const scanner = new PreambleScanner({
      sequences: {
        big: [0xfe, 0xff],
        little: [0xff, 0xfe],
      },
      onPreamble(value) { result = value },
    })

    scanner.pushRange(rangeOf([0xfe]))
    scanner.pushRange(rangeOf([0x00, 0x61]))

    expect(result.match).toBe(null)
    expect(valuesOf(result.preamble)).toEqual([])
    expect(valuesOf(result.remainder)).toEqual([0xfe, 0x00, 0x61])
  })

  it('resolves with no preamble as soon as the first byte cannot match', () => {
    let result = null
    const scanner = new PreambleScanner({
      sequences: {
        signature: [0xef, 0xbb, 0xbf],
      },
      onPreamble(value) { result = value },
    })

    scanner.pushRange(rangeOf([0x61, 0x62]))

    expect(result.match).toBe(null)
    expect(valuesOf(result.preamble)).toEqual([])
    expect(valuesOf(result.remainder)).toEqual([0x61, 0x62])
  })

  it('fires only once', () => {
    const scanner = new PreambleScanner({
      sequences: {
        big: [0xfe, 0xff],
      },
      onPreamble() { },
    })

    scanner.pushRange(rangeOf([0xfe, 0xff]))

    expect(() => scanner.pushRange(rangeOf([0x00])))
      .toThrow('Preamble scanner has already resolved.')
  })
})
