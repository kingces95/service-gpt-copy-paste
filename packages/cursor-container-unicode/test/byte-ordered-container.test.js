import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { Lazy } from '@kingjs/lazy'
import { ByteOrderedContainer } from '../index.js'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

describe('ByteOrderedContainer', () => {
  it('requires a byte width greater than one', () => {
    expect(() => new ByteOrderedContainer({
      byteOrder: 'big',
      byteWidth: 1,
    })).toThrow('Byte width must be greater than one.')
  })

  it('decodes fixed-width big-endian byte units', () => {
    const input = new ByteOrderedContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x12, 0x34, 0xab, 0xcd]))

    expect([...iterate(input)]).toEqual([0x1234, 0xabcd])
  })

  it('decodes fixed-width little-endian byte units', () => {
    const input = new ByteOrderedContainer({
      byteOrder: 'little',
      byteWidth: 4,
    })

    input.pushRange(rangeOf([0x78, 0x56, 0x34, 0x12]))

    expect([...iterate(input)]).toEqual([0x12345678])
  })

  it('does not resolve byte order to trim dangling source bytes', () => {
    let calls = 0
    const input = new ByteOrderedContainer({
      byteOrder: new Lazy(() => {
        calls++
        return 'big'
      }),
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x00]))

    expect([...iterate(input)]).toEqual([])
    expect(calls).toBe(0)
  })

  it('preserves lazy byte order when splitting empty content', () => {
    let calls = 0
    const input = new ByteOrderedContainer({
      byteOrder: new Lazy(() => {
        calls++
        return 'big'
      }),
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x00]))

    const committed = input.split()

    expect(committed.lazyByteOrder).toBe(input.lazyByteOrder)
    expect(calls).toBe(0)
  })

  it('resolves byte order when decoding a complete unit', () => {
    let calls = 0
    const input = new ByteOrderedContainer({
      byteOrder: new Lazy(() => {
        calls++
        return 'big'
      }),
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x12, 0x34]))

    expect([...iterate(input)]).toEqual([0x1234])
    expect(calls).toBe(1)
  })

  it('returns committed source bytes', () => {
    const input = new ByteOrderedContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x00, 0x01, 0x00, 0x02]))

    const cursor = input.begin()
    cursor.step()

    const committed = input.popRange(cursor)

    expect([...iterate(committed)]).toEqual([0x00, 0x01])
    expect([...iterate(input)]).toEqual([0x0002])
  })

  it('trims dangling partial byte units from its end cursor', () => {
    const input = new ByteOrderedContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x00, 0x01, 0x00]))

    expect([...iterate(input)]).toEqual([0x0001])
  })
})
