import { describe, it, expect } from 'vitest'
import { compose } from '@kingjs/partial-compose'
import { Composes, PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

class BasePart extends PartialClass {
  member() { return 'base' }
}

class ProceduralDerivedPart extends PartialClass {
  static {
    compose(this, BasePart)
  }
}

class DeclarativeDerivedPart extends PartialClass {
  static [Composes] = BasePart
}

const Cases = [
  ['procedural partial composition', ProceduralDerivedPart],
  ['declarative partial composition', DeclarativeDerivedPart],
]

describe('attachment order', () => {
  describe.each(Cases)('%s', (name, DerivedPart) => {
    it('includes base Parts in concrete reflected prototype chains', () => {
      class Type {
        static {
          compose(this, DerivedPart)
        }
      }

      const chain = [...PartialReflect.components(Type)]
      expect(chain).toContain(DerivedPart)
      expect(chain).toContain(BasePart)
    })

    it('allows base Parts to be attached before their extensions', () => {
      class Type {
        static {
          compose(this, BasePart)
          compose(this, DerivedPart)
        }
      }

      expect(new Type().member()).toBe('base')
    })

    it('rejects base Parts attached after their extensions', () => {
      expect(() => class Type {
        static {
          compose(this, DerivedPart)
          compose(this, BasePart)
        }
      }).toThrow('BasePart must be attached before')
    })
  })
})
