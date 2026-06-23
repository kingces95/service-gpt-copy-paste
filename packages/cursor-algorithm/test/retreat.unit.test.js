import { describe, it, expect } from 'vitest'
import {
  ArrayMap,
  List,
} from '@kingjs/cursor-container-standard'
import { retreat } from '@kingjs/cursor-algorithm'
import { withMethod } from '../../partial-concept/test/with-method.js'
import { createContainer } from '../../cursor-container/test/create-container.js'

const Values = [1, 2, 3]

describe('retreat', () => {
  it('should retreat a cursor one step at a time', () => {
    const source = createContainer(List, Values)
    const cursor = source.end()
    let stepCount = 0

    withMethod(cursor, 'stepBack', stepBack => function() {
      stepCount++
      return stepBack.call(this)
    }, () => {
      expect(retreat(cursor, 2)).toBe(cursor)
    })

    expect(stepCount).toBe(2)
    expect(cursor.value).toBe(2)
  })

  it('should stop at the bound cursor', () => {
    const source = createContainer(List, Values)
    const bound = source.begin()
    const cursor = source.end()

    expect(retreat(cursor, 3, bound)).toBe(cursor)
    expect(cursor.equals(bound)).toBe(true)
  })

  it('should use random access move when available', () => {
    const source = createContainer(ArrayMap, Values)
    const cursor = source.end()
    let movedBy

    withMethod(cursor, 'stepBack', () => function() {
      throw new Error('stepBack should not be called.')
    }, () => withMethod(cursor, 'move', move => function(offset) {
      movedBy = offset
      return move.call(this, offset)
    }, () => {
      expect(retreat(cursor, 2)).toBe(cursor)
    }))

    expect(movedBy).toBe(-2)
    expect(cursor.value).toBe(2)
  })
})
