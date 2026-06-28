import { describe, it, expect } from 'vitest'
import { Defines, DefinesAbstract, Composes, PartialClass } from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'

class BasePart extends PartialClass {
  static [DefinesAbstract] = {
    member() { },
  }
}

class DefaultPart extends PartialClass {
  static [Defines] = {
    member() { return 'default' },
  }
}

class DerivedPart extends PartialClass {
  static [Composes] = BasePart
  static {
    compose(this, BasePart, {
      member() { return 'default' },
    })
  }
}

class SpecializedType {
  static {
    compose(this, BasePart, {
      member() { return 'specialized' },
    })

    compose(this, DerivedPart)
  }
}

class DefaultType {
  static {
    compose(this, BasePart, { }, {
      member() { },
    })

    compose(this, DerivedPart)
  }
}

class ReappliedDefaultType {
  static {
    compose(this, DefaultPart, {
      member() { return 'specialized' },
    })

    compose(this, DefaultPart)
  }
}

describe('Partial composition default specializations', () => {
  it('preserves a concrete implementation attached with a base part', () => {
    expect(new SpecializedType().member()).toBe('specialized')
  })

  it('uses a derived default when the base part is left abstract', () => {
    expect(new DefaultType().member()).toBe('default')
  })

  it('reapplies an own default when the same part is composed again', () => {
    expect(new ReappliedDefaultType().member()).toBe('default')
  })
})
