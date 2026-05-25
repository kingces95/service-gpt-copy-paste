import { describe, it, expect } from 'vitest'
import {
  ArrayMap,
  ForwardList,
} from '@kingjs/cursor-container'
import { advance } from '@kingjs/cursor-algorithm'
import { createContainer } from '../../cursor-container/test/create-container.js'

const Values = [1, 2, 3]

describe('advance', () => {
  it('should advance a forward cursor one step at a time', () => {
    const source = createContainer(ForwardList, Values)
    const cursor = source.begin()
    const step = cursor.step
    let stepCount = 0

    cursor.step = function() {
      stepCount++
      return step.call(this)
    }

    expect(advance(cursor, 2)).toBe(cursor)
    expect(stepCount).toBe(2)
    expect(cursor.value).toBe(3)
  })

  it('should use random access move when available', () => {
    const source = createContainer(ArrayMap, Values)
    const cursor = source.begin()
    const move = cursor.move
    let movedBy

    cursor.step = function() {
      throw new Error('step should not be called.')
    }

    cursor.move = function(offset) {
      movedBy = offset
      return move.call(this, offset)
    }

    expect(advance(cursor, 2)).toBe(cursor)
    expect(movedBy).toBe(2)
    expect(cursor.value).toBe(3)
  })
})
