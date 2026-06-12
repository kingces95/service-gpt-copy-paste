import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView, TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import { spanTypeOfRange, spansOfRange } from '@kingjs/cursor-shape'
import {
  FixedStrideVirtualContainerOf,
  findSequence,
  matchPrefix,
  VirtualPart,
  RangeContainer,
  RangeContainerOf,
} from '../index.js'

function rangeOf(...chunks) {
  const result = new RangeContainer()
  for (const chunk of chunks)
    result.pushRange(new SnapshotView(chunk))
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

  it('finds virtual values with a plain logical needle', () => {
    const range = virtualRangeOf([1, 2, 3])
    const match = findSequence(range, [102])

    expect(match.begin.value).toBe(102)
    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2])
  })

  it('finds virtual values across virtual pages', () => {
    const range = virtualRangeOf([1, 2], [3, 4])
    const match = findSequence(range, [102, 103])

    expect(match.begin.value).toBe(102)
    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('uses byte spans before reading cursor values', () => {
    const range = new ThrowingByteRange(Uint8Array.from([1, 2, 3, 4]))
    const match = findSequence(range, [2, 3])

    expect(match.begin.index).toBe(1)
    expect(match.end.index).toBe(3)
  })

  it('falls back when a byte match crosses spans', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const range = new Uint8RangeContainer()

    range
      .pushRange(new TypedArrayView(Uint8Array.from([1, 2])))
      .pushRange(new TypedArrayView(Uint8Array.from([3, 4])))

    const match = findSequence(range, [2, 3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })

  it('scopes byte fallback to candidate starts in the span tail', () => {
    const range = new TailReadableByteRange([
      Uint8Array.from([0, 0, 1]),
      Uint8Array.from([2]),
    ])
    const match = findSequence(range, [1, 2])

    expect(match.begin.index).toBe(2)
    expect(match.end.index).toBe(4)
  })

  it('returns range container cursors from a byte span match', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const range = new Uint8RangeContainer()

    range.pushRange(new TypedArrayView(Uint8Array.from([1, 2, 3, 4])))

    const match = findSequence(range, [2, 3])

    expect(valuesOf(range.popRange(match.end))).toEqual([1, 2, 3])
  })
})

const VirtualByteRange = (() => {
  const Uint8RangeContainer = RangeContainerOf(Uint8Array)
  const FixedStrideVirtualContainer = FixedStrideVirtualContainerOf(Uint8Array)

  return class VirtualByteRange extends FixedStrideVirtualContainer {
    constructor() {
      super(new Uint8RangeContainer())
    }

    static {
      compose(this, VirtualPart, {
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

  get value() {
    throw new Error('Cursor value should not be read.')
  }
}

ThrowingByteRange.cursorType = ThrowingByteCursor

class TailReadableByteRange {
  constructor(spans) {
    this.spansValue = spans
    this.bytes = spans.flatMap(span => [...span])
  }

  begin() { return new TailReadableByteCursor(this, 0) }
  end() { return new TailReadableByteCursor(this, this.bytes.length) }
  *spans() {
    let base = 0

    for (const span of this.spansValue) {
      const spanBase = base

      yield {
        span,
        cursorAt: offset =>
          new TailReadableByteCursor(this, spanBase + offset),
      }

      base += span.length
    }
  }
}

class TailReadableByteCursor {
  static spanType = Uint8Array

  constructor(range, index) {
    this.range = range
    this.index = index
  }

  clone() { return new this.constructor(this.range, this.index) }
  equals(other) {
    return other instanceof TailReadableByteCursor &&
      this.range == other.range &&
      this.index == other.index
  }
  step() {
    this.index++
    return this
  }

  get value() {
    if (this.index < 2)
      throw new Error('Byte fallback should start at the span tail.')

    return this.range.bytes[this.index]
  }
}

TailReadableByteRange.cursorType = TailReadableByteCursor

describe('span projections', () => {
  it('projects spans through a range of ranges', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const range = new Uint8RangeContainer()

    range
      .pushRange(new TypedArrayView(Uint8Array.from([1, 2])))
      .pushRange(new TypedArrayView(Uint8Array.from([3])))

    expect([...spansOfRange(range)].map(({ span }) => [...span]))
      .toEqual([[1, 2], [3]])
  })

  it('reports the declared span type', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)

    expect(spanTypeOfRange(new Uint8RangeContainer())).toBe(Uint8Array)
  })

  it('asserts homogeneous spans', () => {
    const Uint8RangeContainer = RangeContainerOf(Uint8Array)
    const range = new Uint8RangeContainer()

    range.pushRange(new TypedArrayView(Int8Array.from([1])))

    expect(() => [...spansOfRange(range)]).toThrow(
      'Range span type must match spanType.')
  })
})
