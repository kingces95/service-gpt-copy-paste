import { describe, expect, it } from 'vitest'
import { Shape } from '@kingjs/partial-shape'
import {
  Fields,
  Initializer,
  PartialClass,
  Self,
  initialize,
} from '@kingjs/partial-class'
import { PartialProxy } from '@kingjs/partial-proxy'
import { compose } from '@kingjs/partial-compose'

let counterShapeCheckCount = 0

class CounterShape extends Shape {
  get count() { }
  increment() { }
}

class CountedCounterShape {
  static [Symbol.hasInstance](value) {
    counterShapeCheckCount++
    return value instanceof CounterShape
  }
}

class CounterPart extends PartialClass {
  static [Fields] = {
    _count: undefined,
  }

  static [Initializer](count = 0) {
    this._count = count
  }

  get count() {
    return this._count
  }

  increment() {
    this._count++
    return this
  }
}

class CounterClientPart extends PartialClass {
  static [Self] = [ CountedCounterShape ]

  get triple() {
    const counter = this
    return counter.count * 3
  }

  double() {
    const counter = this
    return counter.count * 2
  }

  incrementTwice() {
    const counter = this

    counter.increment()
    counter.increment()

    return this
  }
}

class CounterSummaryPart extends PartialClass {
  static [Self] = CounterPart

  summary() {
    const cp = this
    return `count:${cp.count}`
  }
}

class Counter extends PartialProxy {
  constructor(count) {
    super()
    initialize(this, CounterPart, count)
  }

  static {
    compose(this, CounterPart)
    compose(this, CounterClientPart)
    compose(this, CounterSummaryPart)
  }
}

class MissingCounter extends PartialProxy {
  static {
    compose(this, CounterClientPart)
  }
}

describe('part requirements', () => {
  it('allows a part to assume required receiver facets', () => {
    counterShapeCheckCount = 0
    const counter = new Counter(3)

    expect(counter.double()).toBe(6)

    counter.incrementTwice()

    expect(counter.count).toBe(5)
    expect(counter.double()).toBe(10)
    expect(counter.triple).toBe(15)
    expect(counter.summary()).toBe('count:5')
    expect(counterShapeCheckCount).toBe(1)
  })

  it('asserts when the receiver does not satisfy the facet', () => {
    counterShapeCheckCount = 0
    const counter = new MissingCounter()

    expect(() => counter.double())
      .toThrow('CounterClientPart requires CountedCounterShape.')
    expect(() => counter.double())
      .toThrow('CounterClientPart requires CountedCounterShape.')
    expect(() => counter.triple)
      .toThrow('CounterClientPart requires CountedCounterShape.')
    expect(counterShapeCheckCount).toBe(3)
  })
})
