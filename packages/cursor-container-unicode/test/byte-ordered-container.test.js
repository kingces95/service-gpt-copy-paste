import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { Utf16ByteOrderMarks } from '@kingjs/unicode'
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

  it('preserves unspecified byte order when splitting empty content', () => {
    const input = new ByteOrderedContainer({
      byteOrder: Utf16ByteOrderMarks,
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x00]))

    const committed = input.split()

    expect([...iterate(committed)]).toEqual([])
  })

  it('resolves byte order when decoding a complete unit', () => {
    const input = new ByteOrderedContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x12, 0x34]))

    expect([...iterate(input)]).toEqual([0x1234])
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

  it('waits for enough bytes before resolving a byte order mark', () => {
    const input = new ByteOrderedContainer({
      byteOrder: Utf16ByteOrderMarks,
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0xfe]))

    expect([...iterate(input)]).toEqual([])
  })

  it('consumes a detected byte order mark', () => {
    const input = new ByteOrderedContainer({
      byteOrder: Utf16ByteOrderMarks,
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0xfe]))
    input.pushRange(rangeOf([0xff, 0x00, 0x61]))

    expect(input.byteOrder).toBe('big')
    expect([...iterate(input)]).toEqual([0x0061])
  })

  it('treats explicit byte order as already resolved', () => {
    const input = new ByteOrderedContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0xff, 0xfe]))

    expect(input.byteOrder).toBe('big')
    expect([...iterate(input)]).toEqual([0xfffe])
  })

  it('preserves resolved byte order across split', () => {
    const input = new ByteOrderedContainer({
      byteOrder: Utf16ByteOrderMarks,
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0xff, 0xfe, 0x61, 0x00, 0x62, 0x00]))

    const cursor = input.begin()
    cursor.step()

    const committed = input.split(cursor)

    expect(committed.byteOrder).toBe('little')
    expect([...iterate(committed)]).toEqual([0x0061])
    expect([...iterate(input)]).toEqual([0x0062])
  })
})
