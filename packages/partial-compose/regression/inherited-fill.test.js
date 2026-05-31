import { describe, it, expect } from 'vitest'
import { compose } from '@kingjs/partial-compose'
import { Composes, PartialClass } from '@kingjs/partial-class'

class BasePart extends PartialClass {
  member() { return 'base' }
}

const Cases = [
  ['copied with compose()', class DerivedPart extends PartialClass {
    static {
      compose(this, BasePart)
    }
  }],
  ['declared with [Composes]', class DerivedPart extends PartialClass {
    static [Composes] = [
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
          compose(this, BasePart, {
            member() { return 'type' },
          })

          compose(this, DerivedPart)
        }
      }

      expect(new Type().member()).toBe('type')
    })

    it('fills holes when no concrete implementation exists', () => {
      class Type {
        static {
          compose(this, DerivedPart)
        }
      }

      expect(new Type().member()).toBe('base')
    })
  })
})
