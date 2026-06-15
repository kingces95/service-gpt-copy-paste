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

function projectorHost() {
  return {
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
  it('knows which page offsets are synchronized', () => {
    const range = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const page = new Page(range)
    const projector = new FixedStrideProjector(projectorHost(), {
      strideLength: 2,
    })

    expect(projector.isSynchronized(page, cursorAt(page, 0))).toBe(true)
    expect(projector.isSynchronized(page, cursorAt(page, 1))).toBe(false)
    expect(projector.isSynchronized(page, cursorAt(page, 2))).toBe(true)
  })

  it('synchronizes backward within the page when it can', () => {
    const range = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const page = new Page(range)
    const projector = new FixedStrideProjector(projectorHost(), {
      strideLength: 2,
    })

    const cursor = projector.synchronize(page, cursorAt(page, 3))

    expect(cursor.value).toBe(2)
    expect(projector.isSynchronized(page, cursor)).toBe(true)
  })

  it('reports null when synchronization would leave the page', () => {
    const range = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const page = new Page(range, { offset: 1 })
    const projector = new FixedStrideProjector(projectorHost(), {
      strideLength: 2,
    })

    expect(projector.synchronize(page, cursorAt(page, 0))).toBe(null)
    expect(projector.synchronize(page, cursorAt(page, 1)).value).toBe(1)
  })
})

describe('VariableStrideProjector', () => {
  it('knows starter offsets are synchronized', () => {
    const range = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const page = new Page(range)
    const projector = new VariableStrideProjector(projectorHost(), {
      isContinuation: value => value == 2,
    })

    expect(projector.isSynchronized(page, cursorAt(page, 0))).toBe(true)
    expect(projector.isSynchronized(page, cursorAt(page, 1))).toBe(false)
    expect(projector.isSynchronized(page, cursorAt(page, 2))).toBe(true)
    expect(projector.isSynchronized(page, page.end())).toBe(true)
  })

  it('synchronizes backward to the starter in the same page', () => {
    const range = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const page = new Page(range)
    const projector = new VariableStrideProjector(projectorHost(), {
      isContinuation: value => value == 2,
    })

    const cursor = projector.synchronize(page, cursorAt(page, 1))

    expect(cursor.value).toBe(1)
    expect(projector.isSynchronized(page, cursor)).toBe(true)
  })

  it('reports null when the starter is before the page', () => {
    const range = new TypedArrayView(Uint8Array.from([2, 3]))
    const page = new Page(range)
    const projector = new VariableStrideProjector(projectorHost(), {
      isContinuation: value => value == 2,
    })

    expect(projector.synchronize(page, page.begin())).toBe(null)
  })
})
