import { describe, expect, it } from 'vitest'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  FixedStridePageContainer,
  PageContainer,
  VariableStridePageContainer,
} from '../index.js'

function cursorAt(range, offset) {
  const cursor = range.begin()

  for (let i = 0; i < offset; i++)
    cursor.step()

  return cursor
}

describe('PageContainer', () => {
  it('virtualizes offsets through its activation callback', () => {
    const range = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const page = new PageContainer(range, {
      virtualizeOffset: offset => ({ offset }),
    })

    const cursor = cursorAt(page, 2)

    expect(cursor.value).toBe(3)
    expect(cursor.isSynchronized()).toBe(true)
    expect(cursor.virtualize()).toEqual({ offset: 2 })
  })
})

describe('FixedStridePageContainer', () => {
  it('knows which page offsets are synchronized', () => {
    const range = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const page = new FixedStridePageContainer(range, {
      modulus: 0,
      strideLength: 2,
      virtualizeOffset: offset => ({ offset }),
    })

    expect(cursorAt(page, 0).isSynchronized()).toBe(true)
    expect(cursorAt(page, 1).isSynchronized()).toBe(false)
    expect(cursorAt(page, 2).isSynchronized()).toBe(true)
    expect(cursorAt(page, 1).virtualize()).toBe(null)
    expect(cursorAt(page, 2).virtualize()).toEqual({ offset: 2 })
  })

  it('synchronizes backward within the page when it can', () => {
    const range = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const page = new FixedStridePageContainer(range, {
      modulus: 0,
      strideLength: 2,
      virtualizeOffset: offset => ({ offset }),
    })

    const cursor = cursorAt(page, 3).synchronize()

    expect(cursor.value).toBe(2)
    expect(cursor.isSynchronized()).toBe(true)
  })

  it('reports null when synchronization would leave the page', () => {
    const range = new TypedArrayView(Uint8Array.from([0, 1, 2, 3]))
    const page = new FixedStridePageContainer(range, {
      modulus: 1,
      strideLength: 2,
      virtualizeOffset: offset => ({ offset }),
    })

    expect(cursorAt(page, 0).synchronize()).toBe(null)
    expect(cursorAt(page, 1).synchronize().value).toBe(1)
  })
})

describe('VariableStridePageContainer', () => {
  it('knows starter offsets are synchronized', () => {
    const range = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const page = new VariableStridePageContainer(range, {
      isContinuation: value => value == 2,
      virtualizeOffset: offset => ({ offset }),
    })

    expect(cursorAt(page, 0).isSynchronized()).toBe(true)
    expect(cursorAt(page, 1).isSynchronized()).toBe(false)
    expect(cursorAt(page, 2).isSynchronized()).toBe(true)
    expect(page.end().isSynchronized()).toBe(true)
    expect(cursorAt(page, 1).virtualize()).toBe(null)
  })

  it('synchronizes backward to the starter in the same page', () => {
    const range = new TypedArrayView(Uint8Array.from([1, 2, 3]))
    const page = new VariableStridePageContainer(range, {
      isContinuation: value => value == 2,
      virtualizeOffset: offset => ({ offset }),
    })

    const cursor = cursorAt(page, 1).synchronize()

    expect(cursor.value).toBe(1)
    expect(cursor.isSynchronized()).toBe(true)
  })

  it('reports null when the starter is before the page', () => {
    const range = new TypedArrayView(Uint8Array.from([2, 3]))
    const page = new VariableStridePageContainer(range, {
      isContinuation: value => value == 2,
      virtualizeOffset: offset => ({ offset }),
    })

    expect(page.begin().synchronize()).toBe(null)
  })
})
