import { describe, expect, it } from 'vitest'
import {
  Defines,
  DefinesAbstract,
  PartialClass,
  Self,
} from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'
import { Concept } from '@kingjs/partial-concept'
import { implement } from '@kingjs/partial-implement'
import { override } from './index.js'

class NamedPart extends PartialClass {
  static [Defines] = {
    name() { return 'part' },
  }
}

class AbstractPart extends PartialClass {
  static [DefinesAbstract] = {
    name() { },
  }
}

class NamedConcept extends Concept {
  name() { }
}

describe('override', () => {
  it('overrides a concrete member on a composed part', () => {
    class Type {
      static {
        compose(this, NamedPart)
        override(this, NamedPart, {
          name() { return 'override' },
        })
      }
    }

    expect(new Type().name()).toBe('override')
  })

  it('overrides a concept implementation', () => {
    class Type {
      static {
        implement(this, NamedConcept, {
          name() { return 'implementation' },
        })
        override(this, NamedConcept, {
          name() { return 'override' },
        })
      }
    }

    expect(new Type().name()).toBe('override')
  })

  it('overrides a member inherited from a base type composition', () => {
    class BaseType {
      static {
        compose(this, NamedPart)
      }
    }

    class Type extends BaseType {
      static {
        override(this, NamedPart, {
          name() { return 'override' },
        })
      }
    }

    expect(new Type().name()).toBe('override')
  })

  it('overrides a required self facet', () => {
    class Type {
      static [Self] = NamedPart

      static {
        override(this, NamedPart, {
          name() { return 'override' },
        })
      }
    }

    expect(new Type().name()).toBe('override')
  })

  it('rejects declarations not composed by the target', () => {
    class Type { }

    expect(() => override(Type, NamedPart, {
      name() { },
    })).toThrow('Type must be composed of NamedPart.')
  })

  it('rejects members not declared by the overridden partial type', () => {
    class Type {
      static {
        compose(this, NamedPart)
      }
    }

    expect(() => override(Type, NamedPart, {
      other() { },
    })).toThrow("NamedPart does not define member 'other'.")
  })

  it('requires abstract members to remain accounted for', () => {
    class Type {
      static {
        compose(this, AbstractPart, { }, {
          name() { },
        })
      }
    }

    expect(() => override(Type, AbstractPart)).toThrow(
      "AbstractPart member 'name' is not accounted for.")
  })

  it('accepts explicitly still-abstract override members', () => {
    class Type {
      static {
        compose(this, AbstractPart, { }, {
          name() { },
        })
        override(this, AbstractPart, { }, {
          name() { },
        })
      }
    }

    expect(() => new Type().name()).toThrow()
  })
})
