import { describe, it, expect } from 'vitest'
import { extend } from '@kingjs/partial-extend'
import { Extends, PartialClass } from '@kingjs/partial-class'

class BasePart extends PartialClass {
  member() { return 'base' }
}

const Cases = [
  ['copied with extend()', class DerivedPart extends PartialClass {
    static {
      extend(this, BasePart)
    }
  }],
  ['declared with [Extends]', class DerivedPart extends PartialClass {
    static [Extends] = [
      BasePart,
    ]
  }],
]

describe('inherited descriptor fill', () => {
  describe.each(Cases)('%s', (name, DerivedPart) => {
    it('tracks whether the base descriptor is promoted', () => {
      expect(Object.hasOwn(DerivedPart.prototype, 'member'))
        .toBe(false)
    })

    it('does not overwrite an existing concrete implementation', () => {
      class Type {
        static {
          extend(this, BasePart, {
            member() { return 'type' },
          })

          extend(this, DerivedPart)
        }
      }

      expect(new Type().member()).toBe('type')
    })

    it('fills holes when no concrete implementation exists', () => {
      class Type {
        static {
          extend(this, DerivedPart)
        }
      }

      expect(new Type().member()).toBe('base')
    })
  })
})
