import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import {
  FixedStrideProjectedRangeContainer,
  findSequence,
  matchPrefix,
  Page,
  ProjectedRangePart,
  VirtualContainer,
} from '../index.js'

function rangeOf(...chunks) {
  const result = new VirtualContainer()
  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))
  return result
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('findSequence', () => {
  it('finds a sequence within a range', () => {
    const range = rangeOf([1, 2], [3, 4])
    const match = findSequence(range, [2, 3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('returns null when a sequence is absent', () => {
    const range = rangeOf([1, 2], [3, 4])

    expect(findSequence(range, [2, 4])).toBe(null)
  })

  it('can start from an existing cursor', () => {
    const range = rangeOf([1, 2, 1, 2])
    const from = range.begin()
    from.step()

    const match = findSequence(range, [1, 2], { from })

    expect(valuesOf(range.popRange(match.begin))).toEqual([1, 2])
  })

  it('finds through virtual pages', () => {
    const range = rangeOf([1, 2], [3, 4])
    const match = findSequence(range, [3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('finds virtual values by materializing a virtual needle', () => {
    const range = virtualRangeOf([1, 2, 3])
    const needle = virtualRangeOf([2])
    const match = findSequence(range, needle)

    expect(match.begin.value).toBe(102)
    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2])
  })

  it('rejects a plain logical needle for a virtual range', () => {
    const range = virtualRangeOf([1, 2, 3])

    expect(() => findSequence(range, [102])).toThrow(
      'Projected sequence must match projected range.')
  })

  it('finds virtual values across virtual pages', () => {
    const range = virtualRangeOf([1, 2], [3, 4])
    const needle = virtualRangeOf([2, 3])
    const match = findSequence(range, needle)

    expect(match.begin.value).toBe(102)
    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('does not special-case a virtual needle for a non-virtual range', () => {
    const range = rangeOf([1, 2], [3, 4])
    const needle = virtualRangeOf([2, 3])

    expect(findSequence(range, needle)).toBe(null)
  })

  it('uses byte spans before reading cursor values', () => {
    const page = new Page(
      new ThrowingByteRange(Uint8Array.from([1, 2, 3, 4]))
    )
    const match = findSequence(page, [2, 3])

    expect(match.begin.index).toBe(1)
    expect(match.end.index).toBe(3)
  })

  it('falls back when a byte match crosses spans', () => {

    const range = new VirtualContainer()

    range
      .pushRange(new TypedArrayView(Uint8Array.from([1, 2])))
      .pushRange(new TypedArrayView(Uint8Array.from([3, 4])))

    const match = findSequence(range, [2, 3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('uses page-local byte spans within the requested bounds', () => {
    const page = new Page(
      new TailReadableByteRange(Uint8Array.from([0, 0, 1, 2]))
    )
    const from = page.begin()
    const until = page.end()

    from.step()

    const match = findSequence(page, [1, 2], { from, until })

    expect(match.begin.index).toBe(2)
    expect(match.end.index).toBe(4)
  })

  it('bounds candidate starts while letting matches cross the bound', () => {
    const range = rangeOf([1, 2], [3])
    const from = range.begin()
    const until = from.clone()

    from.step()
    until.step()
    until.step()

    const match = findSequence(range, [2, 3], { from, until })

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('returns range container cursors from a byte span match', () => {

    const range = new VirtualContainer()

    range.pushRange(new TypedArrayView(Uint8Array.from([1, 2, 3, 4])))

    const match = findSequence(range, [2, 3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })
})

const VirtualByteRange = (() => {


  return class VirtualByteRange extends FixedStrideProjectedRangeContainer {
    constructor() {
      super(new VirtualContainer())
    }

    static {
      compose(this, ProjectedRangePart, {
        decodeToken$(sourceCursor, stride) {
          return sourceCursor.value + 100
        },
      })
    }
  }
})()

function virtualRangeOf(...chunks) {
  const result = new VirtualByteRange()

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

describe('matchPrefix', () => {
  it('matches a complete prefix', () => {
    const range = rangeOf([0xff], [0xfe, 1])
    const match = matchPrefix(range, {
      little: [0xff, 0xfe],
      big: [0xfe, 0xff],
    })

    expect(match.state).toBe('matched')
    expect(match.key).toBe('little')
    expect(valuesOf(range.popRange(match.end))).toEqual([0xff, 0xfe])
  })

  it('reports pending when a prefix can still match', () => {
    const range = rangeOf([0xff])
    const match = matchPrefix(range, {
      little: [0xff, 0xfe],
      big: [0xfe, 0xff],
    })

    expect(match.state).toBe('pending')
  })

  it('reports missed when no prefix can match', () => {
    const range = rangeOf([0x00])
    const match = matchPrefix(range, {
      little: [0xff, 0xfe],
      big: [0xfe, 0xff],
    })

    expect(match.state).toBe('missed')
  })
})

class ThrowingByteRange {
  constructor(bytes) {
    this.bytes = bytes
  }

  begin() { return new ThrowingByteCursor(this, 0) }
  end() { return new ThrowingByteCursor(this, this.bytes.length) }
  *spans() {
    yield {
      span: this.bytes,
      cursorAt: offset => new ThrowingByteCursor(this, offset),
    }
  }
}

class ThrowingByteCursor {
  static spanType = Uint8Array

  constructor(range, index) {
    this.range = range
    this.index = index
  }

  clone() { return new this.constructor(this.range, this.index) }
  equals(other) {
    return other instanceof ThrowingByteCursor &&
      this.range == other.range &&
      this.index == other.index
  }
  step() {
    this.index++
    return this
  }

  span(end) {
    return this.range.bytes.subarray(this.index, end.index)
  }

  get value() {
    throw new Error('Cursor value should not be read.')
  }
}

ThrowingByteRange.cursorType = ThrowingByteCursor

class TailReadableByteRange extends ThrowingByteRange {
  constructor(bytes) {
    super(bytes)
  }

  begin() { return new TailReadableByteCursor(this, 0) }
  end() { return new TailReadableByteCursor(this, this.bytes.length) }
}

class TailReadableByteCursor extends ThrowingByteCursor {
  get value() {
    if (this.index < 2)
      throw new Error('Page byte search should not read prefix values.')

    return this.range.bytes[this.index]
  }
}

TailReadableByteRange.cursorType = TailReadableByteCursor
