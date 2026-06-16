import { describe, expect, it } from 'vitest'
import { advance } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  FixedStrideProjector,
  Page,
  VariableStrideProjector,
} from '../index.js'

function cursorAt(range, offset) {
  const cursor = range.begin()
  advance(cursor, offset)
  return cursor
}

function projectorHost(source) {
  return {
    source,
    cursorType: class {
      constructor(container, sourceCursor) {
        this.container = container
        this.sourceCursor = sourceCursor
      }
    },
  }
}

describe('Page', () => {
  it('describes a physical range and virtualizes through a callback', () => {
    const range = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const page = new Page(range, {
      virtualize: cursor => ({ offset: page.offsetOf(cursor) }),
    })

    expect([...page.span()]).toEqual([1, 2, 3])
    expect(cursorAt(page, 1).value).toBe(2)
    expect(page.virtualize(cursorAt(page, 2))).toEqual({ offset: 2 })
  })
})

describe('FixedStrideProjector', () => {
  it('knows which source offsets are synchronized', () => {
    const source = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const projector = new FixedStrideProjector(projectorHost(source), {
      strideLength: 2,
    })

    expect(projector.isSynchronized(cursorAt(source, 0))).toBe(true)
    expect(projector.isSynchronized(cursorAt(source, 1))).toBe(false)
    expect(projector.isSynchronized(cursorAt(source, 2))).toBe(true)
  })

  it('synchronizes backward within the source', () => {
    const source = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const projector = new FixedStrideProjector(projectorHost(source), {
      strideLength: 2,
    })

    const cursor = projector.synchronize(cursorAt(source, 3))

    expect(cursor.value).toBe(2)
    expect(projector.isSynchronized(cursor)).toBe(true)
  })
})

describe('VariableStrideProjector', () => {
  it('knows starter offsets are synchronized', () => {
    const source = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const projector = new VariableStrideProjector(projectorHost(source), {
      isContinuation: value => value == 2,
    })

    expect(projector.isSynchronized(cursorAt(source, 0))).toBe(true)
    expect(projector.isSynchronized(cursorAt(source, 1))).toBe(false)
    expect(projector.isSynchronized(cursorAt(source, 2))).toBe(true)
    expect(projector.isSynchronized(source.end())).toBe(true)
  })

  it('synchronizes backward to the starter in the same page', () => {
    const source = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const projector = new VariableStrideProjector(projectorHost(source), {
      isContinuation: value => value == 2,
    })

    const cursor = projector.synchronize(cursorAt(source, 1))

    expect(cursor.value).toBe(1)
    expect(projector.isSynchronized(cursor)).toBe(true)
  })

  it('reports null when the starter is before the source', () => {
    const source = new TypedArrayView(Uint8Array.from([2, 3]))
    const projector = new VariableStrideProjector(projectorHost(source), {
      isContinuation: value => value == 2,
    })

    expect(projector.synchronize(source.begin())).toBe(null)
  })
})
