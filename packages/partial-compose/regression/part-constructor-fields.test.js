import { describe, expect, it } from 'vitest'
import { assert } from '@kingjs/assert'
import {
  Fields,
  Initializer,
  PartialClass,
  initialize,
} from '@kingjs/partial-class'
import { Concept } from '@kingjs/partial-concept'
import { implement } from '@kingjs/partial-implement'
import { PartialProxy, TypePrecondition } from '@kingjs/partial-proxy'
import { compose } from '@kingjs/partial-compose'

class IndexedCursorConcept extends Concept {
  readIndex() { }
}

class IndexedCursorPart extends PartialClass {
  static [Fields] = {
    _index: undefined,
    _initializerCount: 0,
  }

  static [Initializer](index) {
    assert(this._initializerCount == 0)
    this._index = index
    this._initializerCount++
  }

  get index$() {
    return this._index
  }

  set index$(value) {
    this._index = value
  }

  step() {
    this._index++
    return this
  }

  static {
    implement(this, IndexedCursorConcept, {
      readIndex() {
        return this._index
      },
    })
  }
}

class NormalCursorPart extends PartialClass {
  get value() {
    return 'value'
  }

  ping() {
    return 'pong'
  }
}

class GoodCursor extends PartialProxy {
  constructor(index) {
    super()
    initialize(this, IndexedCursorPart, index)
  }

  static {
    compose(this, IndexedCursorPart)
    compose(this, NormalCursorPart)
  }
}

class OtherGoodCursor extends PartialProxy {
  constructor(index) {
    super()
    initialize(this, IndexedCursorPart, index)
  }

  static {
    compose(this, IndexedCursorPart)
  }
}

class DoubleInitializeCursor extends PartialProxy {
  constructor(index) {
    super()
    initialize(this, IndexedCursorPart, index)
    initialize(this, IndexedCursorPart, index + 1)
  }

  static {
    compose(this, IndexedCursorPart)
  }
}

class BadCursor extends PartialProxy {
  static {
    compose(this, IndexedCursorPart)
    compose(this, NormalCursorPart)
  }
}

class DisposableCursor extends PartialProxy {
  static [TypePrecondition] = function() {
    assert(!this.disposed, 'Cursor is disposed.')
  }

  static {
    compose(this, NormalCursorPart)
  }
}

describe('part constructor fields', () => {
  it('allows a host constructor to install part-owned fields', () => {
    const cursor = new GoodCursor(1)

    expect(cursor.index$).toBe(1)
    expect(cursor.readIndex()).toBe(1)
    expect(cursor._initializerCount).toBe(1)

    cursor.step()

    expect(cursor.index$).toBe(2)
    expect(cursor.readIndex()).toBe(2)
    expect(cursor._initializerCount).toBe(1)

    cursor.index$ = 3

    expect(cursor.index$).toBe(3)
    expect(cursor.readIndex()).toBe(3)
    expect(cursor._initializerCount).toBe(1)
  })

  it('keeps field initialization scoped to each receiver', () => {
    const cursor = new DoubleInitializeCursor(1)

    expect(cursor.index$).toBe(1)
    expect(cursor._initializerCount).toBe(1)

    cursor.step()

    expect(cursor.index$).toBe(2)
    expect(cursor._initializerCount).toBe(1)
  })

  it('does not share field initialization across target classes', () => {
    const cursor = new GoodCursor(1)
    const other = new OtherGoodCursor(10)
    const bad = new BadCursor()

    cursor.step()
    other.step()

    expect(cursor.index$).toBe(2)
    expect(other.index$).toBe(11)
    expect(() => bad.step())
      .toThrow("IndexedCursorPart field '_index' not initialized.")
  })

  it('fails clearly when the host skips the part constructor', () => {
    const cursor = new BadCursor()

    expect(() => cursor.index$)
      .toThrow("IndexedCursorPart field '_index' not initialized.")

    expect(() => cursor.readIndex())
      .toThrow("IndexedCursorPart field '_index' not initialized.")

    expect(() => cursor.step())
      .toThrow("IndexedCursorPart field '_index' not initialized.")

    expect(() => { cursor.index$ = 3 })
      .toThrow("IndexedCursorPart field '_index' not initialized.")
  })

  it('does not apply a part precondition to sibling parts', () => {
    const cursor = new BadCursor()

    expect(cursor.ping()).toBe('pong')
  })

  it('keeps type preconditions scoped to the host object', () => {
    const cursor = new DisposableCursor()
    cursor.disposed = true

    expect(() => cursor.value).toThrow('Cursor is disposed.')
    expect(() => cursor.ping()).toThrow('Cursor is disposed.')
  })
})
