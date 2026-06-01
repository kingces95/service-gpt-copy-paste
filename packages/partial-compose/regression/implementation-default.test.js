import { describe, expect, it } from 'vitest'
import { Defines } from '@kingjs/partial-class'
import { Concept } from '@kingjs/partial-concept'
import { PartialProxy } from '@kingjs/partial-proxy'
import { implement } from '@kingjs/partial-implement'

class MyConcept extends Concept {
  static [Defines] = {
    get derived() { return this.constructor.derived }
  }

  get derived() { }
  member() { }
}

class MyType extends PartialProxy {
  static derived = 'derived'
  static {
    implement(this, MyConcept, {
      member() { return this.derived }
    })
  }
}

describe('implementation default', () => {
  it('copies concrete defaults declared by the concept', () => {
    const instance = new MyType()
    expect(instance.derived).toBe('derived')
    expect(instance.member()).toBe('derived')
  })
})
