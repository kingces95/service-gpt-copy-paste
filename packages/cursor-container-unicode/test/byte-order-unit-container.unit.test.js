import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { ByteOrderUnitContainer } from '../index.js'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

describe('ByteOrderUnitContainer', () => {
  it('requires a byte width greater than one', () => {
    expect(() => new ByteOrderUnitContainer({
      byteOrder: 'big',
      byteWidth: 1,
    })).toThrow('Byte width must be greater than one.')
  })

  it('decodes fixed-width big-endian byte units', () => {
    const input = new ByteOrderUnitContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x12, 0x34, 0xab, 0xcd]))

    expect([...iterate(input)]).toEqual([0x1234, 0xabcd])
  })

  it('decodes fixed-width little-endian byte units', () => {
    const input = new ByteOrderUnitContainer({
      byteOrder: 'little',
      byteWidth: 4,
    })

    input.pushRange(rangeOf([0x78, 0x56, 0x34, 0x12]))

    expect([...iterate(input)]).toEqual([0x12345678])
  })

  it('returns committed source bytes', () => {
    const input = new ByteOrderUnitContainer({
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
    const input = new ByteOrderUnitContainer({
      byteOrder: 'big',
      byteWidth: 2,
    })

    input.pushRange(rangeOf([0x00, 0x01, 0x00]))

    expect([...iterate(input)]).toEqual([0x0001])
  })
})
