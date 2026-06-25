import { describe, expect, it } from 'vitest'
import { findBytesInSpans } from '../index.js'

describe('findBytesInSpans', () => {
  it('finds a sequence inside one page', () => {
    const match = findBytesInSpans([
      Uint8Array.from([1, 2, 3]),
    ], Uint8Array.from([2, 3]))

    expect(match).toEqual({ spanIndex: 0, spanOffset: 1 })
  })

  it('finds a sequence across pages', () => {
    const match = findBytesInSpans([
      Uint8Array.from([1, 2]),
      Uint8Array.from([3, 4]),
    ], Uint8Array.from([2, 3]))

    expect(match).toEqual({ spanIndex: 0, spanOffset: 1 })
  })

  it('continues after a failed cross-page tail', () => {
    const match = findBytesInSpans([
      Uint8Array.from([1, 2]),
      Uint8Array.from([4, 5]),
      Uint8Array.from([6, 7]),
    ], Uint8Array.from([5, 6]))

    expect(match).toEqual({ spanIndex: 1, spanOffset: 1 })
  })

  it('prefers a cross-page match before a later current-page match', () => {
    const match = findBytesInSpans([
      Uint8Array.from([1, 2]),
      Uint8Array.from([3, 2, 3]),
    ], Uint8Array.from([2, 3]))

    expect(match).toEqual({ spanIndex: 0, spanOffset: 1 })
  })

  it('returns null when absent', () => {
    const match = findBytesInSpans([
      Uint8Array.from([1, 2]),
      Uint8Array.from([3, 4]),
    ], Uint8Array.from([2, 4]))

    expect(match).toBe(null)
  })
})
