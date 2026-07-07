import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { PreambleScanner } from '../index.js'

function valuesOf(range) {
  return [...iterate(range)]
}

describe('PreambleScanner', () => {
  it('waits while a preamble can still match', () => {
    const scanner = new PreambleScanner({
      sequences: {
        'utf-8': [0xef, 0xbb, 0xbf],
      },
    })

    expect(scanner.pushBytes(Uint8Array.from([0xef]))).toBe(null)
    expect(scanner.pushBytes(Uint8Array.from([0xbb]))).toBe(null)
  })

    it('resolves matched key and data', () => {
    const scanner = new PreambleScanner({
      sequences: {
        'utf-16be': [0xfe, 0xff],
        'utf-16le': [0xff, 0xfe],
      },
    })

    expect(scanner.pushBytes(Uint8Array.from([0xfe]))).toBe(null)

    const result = scanner.pushBytes(Uint8Array.from([0xff, 0x00, 0x61]))

    expect(result.key).toBe('utf-16be')
    expect(valuesOf(result.data)).toEqual([0x00, 0x61])
  })

    it('resolves with default key once no sequence can match', () => {
    const scanner = new PreambleScanner({
      sequences: {
        'utf-16be': [0xfe, 0xff],
        'utf-16le': [0xff, 0xfe],
      },
      defaultMetadata: 'utf-8',
    })

    expect(scanner.pushBytes(Uint8Array.from([0xfe]))).toBe(null)

    const result = scanner.pushBytes(Uint8Array.from([0x00, 0x61]))

    expect(result.key).toBe('utf-8')
    expect(valuesOf(result.data)).toEqual([0xfe, 0x00, 0x61])
  })

  it('resolves with no preamble as soon as the first byte cannot match', () => {
    const scanner = new PreambleScanner({
      sequences: {
        'utf-8': [0xef, 0xbb, 0xbf],
      },
      defaultMetadata: 'utf-8',
    })

    const result = scanner.pushBytes(Uint8Array.from([0x61, 0x62]))

    expect(result.key).toBe('utf-8')
    expect(valuesOf(result.data)).toEqual([0x61, 0x62])
  })

  it('can report through a callback', () => {
    let callbackResult = null
    const scanner = new PreambleScanner({
      sequences: {
        'utf-16be': [0xfe, 0xff],
      },
      onPreamble(result) { callbackResult = result },
    })

    const result = scanner.pushBytes(Uint8Array.from([0xfe, 0xff]))

    expect(callbackResult).toBe(result)
  })

  it('fires only once', () => {
    const scanner = new PreambleScanner({
      sequences: {
        'utf-16be': [0xfe, 0xff],
      },
    })

    scanner.pushBytes(Uint8Array.from([0xfe, 0xff]))

    expect(() => scanner.pushBytes(Uint8Array.from([0x00])))
      .toThrow('Preamble scanner has already resolved.')
  })
})
