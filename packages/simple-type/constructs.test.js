import { describe, it, expect } from 'vitest'
import { Metadata } from '@kingjs/metadata'
import {
  AllOf,
  AnyObject,
  ConstructsOf,
} from '@kingjs/simple-type'

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
  it('should expose a generic type specializer', () => {
    expect(typeof ConstructsOf).toBe('function')
  })

  it('should create a ConstructsOf metadata type', () => {
    const PushContainer = ConstructsOf(Pushable)

    expect(PushContainer.name).toBe('Constructs')
    expect(PushContainer.Type).toBe(Pushable)
    expect(PushContainer.prototype).toBeInstanceOf(Metadata)
  })

  it('should create an unconstrained metadata type', () => {
    const Unconstrained = ConstructsOf(AnyObject)

    expect(Queue instanceof Unconstrained).toBe(true)
    expect({ } instanceof Unconstrained).toBe(false)
    expect(() => new Unconstrained()).toThrow(
      'Metadata cannot be instantiated.')
  })

  it('should test the prototype of a constructor', () => {
    const PushContainer = ConstructsOf(Pushable)

    expect(Queue instanceof PushContainer).toBe(true)
    expect(ReadOnlyQueue instanceof PushContainer).toBe(false)
    expect({ } instanceof PushContainer).toBe(false)
  })

  it('should require every requirement', () => {
    const PushPopContainer = ConstructsOf(AllOf(Pushable, Poppable))

    expect(Queue instanceof PushPopContainer).toBe(true)
    expect(ReadOnlyQueue instanceof PushPopContainer).toBe(false)
  })

  it('should cache applied metadata types', () => {
    expect(ConstructsOf(Pushable)).toBe(ConstructsOf(Pushable))
  })
})
