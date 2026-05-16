import { describe, it, expect } from 'vitest'
import { Constructs } from '@kingjs/constructs'

class Pushable {
  static [Symbol.hasInstance](instance) {
    return typeof instance?.push == 'function'
  }
}

class Poppable {
  static [Symbol.hasInstance](instance) {
    return typeof instance?.pop == 'function'
  }
}

class Queue {
  push(value) { }
  pop() { }
}

class ReadOnlyQueue {
  pop() { }
}

describe('Constructs', () => {
  it('should create a ConstructsOf metadata type', () => {
    const ConstructsOf = Constructs.as(Pushable)

    expect(ConstructsOf.name).toBe('ConstructsOf')
    expect(ConstructsOf.targs).toEqual([Pushable])
    expect(Constructs.prototype.isPrototypeOf(ConstructsOf.prototype))
      .toBe(true)
  })

  it('should not be instantiated', () => {
    expect(() => new Constructs()).toThrow(
      'Metadata cannot be instantiated.')
  })

  it('should test the prototype of a constructor', () => {
    const PushContainer = Constructs.as(Pushable)

    expect(Queue instanceof PushContainer).toBe(true)
    expect(ReadOnlyQueue instanceof PushContainer).toBe(false)
    expect({ } instanceof PushContainer).toBe(false)
  })

  it('should require every requirement', () => {
    const PushPopContainer = Constructs.as(Pushable, Poppable)

    expect(Queue instanceof PushPopContainer).toBe(true)
    expect(ReadOnlyQueue instanceof PushPopContainer).toBe(false)
  })

  it('should cache applied metadata types', () => {
    expect(Constructs.as(Pushable)).toBe(Constructs.as(Pushable))
  })
})
