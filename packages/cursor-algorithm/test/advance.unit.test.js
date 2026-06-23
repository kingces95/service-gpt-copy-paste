import { describe, it, expect } from 'vitest'
import {
  ArrayMap,
  ForwardList,
} from '@kingjs/cursor-container-standard'
import { advance } from '@kingjs/cursor-algorithm'
import { withMethod } from '../../partial-concept/test/with-method.js'
import { createContainer } from '../../cursor-container/test/create-container.js'

const Values = [1, 2, 3]

describe('advance', () => {
  it('should advance a forward cursor one step at a time', () => {
    const source = createContainer(ForwardList, Values)
    const cursor = source.begin()
    let stepCount = 0

    withMethod(cursor, 'step', step => function() {
      stepCount++
      return step.call(this)
    }, () => {
      expect(advance(cursor, 2)).toBe(cursor)
    })

    expect(stepCount).toBe(2)
    expect(cursor.value).toBe(3)
  })

  it('should use random access move when available', () => {
    const source = createContainer(ArrayMap, Values)
    const cursor = source.begin()
    let movedBy

    withMethod(cursor, 'step', () => function() {
      throw new Error('step should not be called.')
    }, () => withMethod(cursor, 'move', move => function(offset) {
        movedBy = offset
        return move.call(this, offset)
      }, () => {
        expect(advance(cursor, 2)).toBe(cursor)
      }))

    expect(movedBy).toBe(2)
    expect(cursor.value).toBe(3)
  })

  it('should stop at an until cursor', () => {
    const source = createContainer(ForwardList, Values)
    const cursor = source.begin()
    const until = source.begin()
    until.step()

    expect(advance(cursor, 2, until)).toBe(cursor)
    expect(cursor.value).toBe(2)
  })

  it('should not move past an until cursor when random access is available', () => {
    const source = createContainer(ArrayMap, Values)
    const cursor = source.begin()
    const until = source.begin()
    until.step()
    let moveCount = 0
    let movedBy = 0

    withMethod(cursor, 'move', move => function(offset) {
      moveCount++
      movedBy += offset
      return move.call(this, offset)
    }, () => {
      expect(advance(cursor, 2, until)).toBe(cursor)
    })

    expect(moveCount).toBe(1)
    expect(movedBy).toBe(1)
    expect(cursor.value).toBe(2)
  })
})
