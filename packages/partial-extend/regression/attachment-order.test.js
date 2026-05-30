import { describe, it, expect } from 'vitest'
import { extend } from '@kingjs/partial-extend'
import { Extends, PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

class BasePart extends PartialClass {
  member() { return 'base' }
}

class ProceduralDerivedPart extends PartialClass {
  static {
    extend(this, BasePart)
  }
}

class DeclarativeDerivedPart extends PartialClass {
  static [Extends] = BasePart
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
          extend(this, DerivedPart)
        }
      }

      const chain = [...PartialReflect.baseTypes(Type)]
      expect(chain).toContain(DerivedPart)
      expect(chain).toContain(BasePart)
    })

    it('allows base Parts to be attached before their extensions', () => {
      class Type {
        static {
          extend(this, BasePart)
          extend(this, DerivedPart)
        }
      }

      expect(new Type().member()).toBe('base')
    })

    it('rejects base Parts attached after their extensions', () => {
      expect(() => class Type {
        static {
          extend(this, DerivedPart)
          extend(this, BasePart)
        }
      }).toThrow('BasePart must be attached before')
    })
  })
})
