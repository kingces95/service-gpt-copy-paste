import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import { initialize } from '@kingjs/partial-class'
import {
  ProjectedRangeContainer,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import { ByteOrderedPart } from '../index.js'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

class ByteOrderedTestContainer extends ProjectedRangeContainer {
  constructor(byteOrder, byteWidth) {
    super(new VirtualContainer())
    initialize(this, ByteOrderedPart, byteOrder, byteWidth)
  }

  static {
    compose(this, ByteOrderedPart)
  }
}

describe('ByteOrderedPart', () => {
  it('requires a byte width greater than one', () => {
    expect(() => new ByteOrderedTestContainer('big', 1))
      .toThrow('Byte width must be greater than one.')
  })

  it('requires explicit byte order', () => {
    expect(() => new ByteOrderedTestContainer(null, 2))
      .toThrow('Byte order must be big or little.')
  })

  it('decodes fixed-width big-endian byte units', () => {
    const input = new ByteOrderedTestContainer('big', 2)

    input.pushRange(rangeOf([0x12, 0x34, 0xab, 0xcd]))

    expect([...iterate(input)]).toEqual([0x1234, 0xabcd])
  })

  it('decodes fixed-width little-endian byte units', () => {
    const input = new ByteOrderedTestContainer('little', 4)

    input.pushRange(rangeOf([0x78, 0x56, 0x34, 0x12]))

    expect([...iterate(input)]).toEqual([0x12345678])
  })

  it('resolves byte order when decoding a complete unit', () => {
    const input = new ByteOrderedTestContainer('big', 2)

    input.pushRange(rangeOf([0x12, 0x34]))

    expect([...iterate(input)]).toEqual([0x1234])
  })

  it('returns committed source bytes', () => {
    const input = new ByteOrderedTestContainer('big', 2)

    input.pushRange(rangeOf([0x00, 0x01, 0x00, 0x02]))

    const cursor = input.begin()
    cursor.step()

    const committed = input.popRangeAt(cursor)

    expect([...iterate(committed)]).toEqual([0x00, 0x01])
    expect([...iterate(input)]).toEqual([0x0002])
  })

  it('trims dangling partial byte units from its end cursor', () => {
    const input = new ByteOrderedTestContainer('big', 2)

    input.pushRange(rangeOf([0x00, 0x01, 0x00]))

    expect([...iterate(input)]).toEqual([0x0001])
  })

  it('treats explicit byte order as already resolved', () => {
    const input = new ByteOrderedTestContainer('big', 2)

    input.pushRange(rangeOf([0xff, 0xfe]))

    expect([...iterate(input)]).toEqual([0xfffe])
  })

})
