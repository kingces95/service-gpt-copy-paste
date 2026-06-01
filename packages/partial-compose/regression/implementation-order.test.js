import { describe, expect, it } from 'vitest'
import { DefinesAbstract } from '@kingjs/partial-class'
import { PartialClass } from '@kingjs/partial-class'
import { PartialProxy } from '@kingjs/partial-proxy'
import { compose } from '@kingjs/partial-compose'

class BasePart extends PartialClass {
  static [DefinesAbstract] = {
    member() { },
  }
}

class DerivedPart extends BasePart {
}

class MyType extends PartialProxy {
  static {
    compose(this, BasePart, {
      member() { return 'base implementation' },
    })

    compose(this, DerivedPart)
  }
}

describe('implementation order', () => {
  it('fills the declaration slot after graph linearization dedups the base part', () => {
    const instance = new MyType()

    expect(instance.member()).toBe('base implementation')
  })
})
