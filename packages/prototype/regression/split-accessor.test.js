import { describe, it, expect } from 'vitest'
import { Prototype } from '@kingjs/prototype'

// Regression
//
// When a setter appears before a getter
// ├─ APIs that accept splitAccessors
// │  ├─ without splitAccessors
// │  │  ├─ getDescriptor returns the setter-only runtime descriptor
// │  │  ├─ hasGetter does not find the hidden getter
// │  │  ├─ hasSetter finds the runtime setter
// │  │  ├─ getValue does not read the setter-only descriptor
// │  │  ├─ descriptors suppresses by key
// │  │  ├─ values projects runtime-readable descriptors
// │  │  ├─ keys suppresses by key
// │  │  └─ copyTo materializes the setter-only runtime descriptor
// │  └─ with splitAccessors
// │     ├─ getDescriptor resolves both accessor halves
// │     ├─ hasGetter finds the resolved getter
// │     ├─ hasSetter finds the resolved setter
// │     ├─ getValue reads the resolved getter
// │     ├─ descriptors suppresses by accessor slot
// │     ├─ values projects resolved readable slots
// │     ├─ keys preserves split accessor key hits
// │     └─ copyTo materializes merged accessor halves
// └─ APIs that do not accept splitAccessors
//    ├─ findDescriptors
//    │  └─ searches raw descriptor slots
//    ├─ findValues
//    │  └─ searches readable slots and skips setter-only descriptors
//    └─ hasKey
//       └─ tests prototype-chain key presence

describe('When a setter appears before a getter', () => {
  class Base {
    get value() { return 'base' }
  }

  class Derived extends Base {
    set value(value) { this._value = value }
  }

  describe('APIs that accept splitAccessors', () => {
    describe('without splitAccessors', () => {
      it('getDescriptor returns the setter-only runtime descriptor', () => {
        const actual = Prototype.getDescriptor(Derived.prototype, 'value')

        expect(actual.get).toBeUndefined()
        expect(actual.set).toBeDefined()
      })

      it('hasGetter does not find the hidden getter', () => {
        expect(Prototype.hasGetter(Derived.prototype, 'value')).toBe(false)
      })

      it('hasSetter finds the runtime setter', () => {
        expect(Prototype.hasSetter(Derived.prototype, 'value')).toBe(true)
      })

      it('getValue does not read the setter-only descriptor', () => {
        const actual = Prototype.getValue(Derived.prototype, 'value', {
          instance: new Derived(),
        })

        expect(actual).toBeNull()
      })

      it('descriptors suppresses by key', () => {
        const actual = descriptors()

        expect(actual).toHaveLength(1)
        expect(actual[0].get).toBeUndefined()
        expect(actual[0].set).toBeDefined()
      })

      it('values projects runtime-readable descriptors', () => {
        const actual = values()

        expect(actual).toEqual([])
      })

      it('keys suppresses by key', () => {
        const actual = keys()

        expect(actual).toEqual(['value'])
      })

      it('copyTo materializes the setter-only runtime descriptor', () => {
        const actual = copyTo()

        expect(actual.get).toBeUndefined()
        expect(actual.set).toBeDefined()
      })
    })

    describe('with splitAccessors', () => {
      it('getDescriptor resolves both accessor halves', () => {
        const actual = Prototype.getDescriptor(Derived.prototype, 'value', {
          splitAccessors: true,
        })

        expect(actual.get).toBeDefined()
        expect(actual.set).toBeDefined()
      })

      it('hasGetter finds the resolved getter', () => {
        expect(Prototype.hasGetter(Derived.prototype, 'value', {
          splitAccessors: true,
        })).toBe(true)
      })

      it('hasSetter finds the resolved setter', () => {
        expect(Prototype.hasSetter(Derived.prototype, 'value', {
          splitAccessors: true,
        })).toBe(true)
      })

      it('getValue reads the resolved getter', () => {
        const actual = Prototype.getValue(Derived.prototype, 'value', {
          instance: new Derived(),
          splitAccessors: true,
        })

        expect(actual).toBe('base')
      })

      it('descriptors suppresses by accessor slot', () => {
        const actual = descriptors({ splitAccessors: true })

        expect(actual).toHaveLength(2)
        expect(actual[0].get).toBeUndefined()
        expect(actual[0].set).toBeDefined()
        expect(actual[1].get).toBeDefined()
        expect(actual[1].set).toBeUndefined()
      })

      it('values projects resolved readable slots', () => {
        const actual = values({ splitAccessors: true })

        expect(actual.map(({ value }) => value)).toEqual(['base'])
      })

      it('keys preserves split accessor key hits', () => {
        const actual = keys({ splitAccessors: true })

        expect(actual).toEqual(['value', 'value'])
      })

      it('copyTo materializes merged accessor halves', () => {
        const actual = copyTo({ splitAccessors: true })

        expect(actual.get).toBeDefined()
        expect(actual.set).toBeDefined()
      })
    })
  })

  describe('APIs that do not accept splitAccessors', () => {
    it('findDescriptors searches raw descriptor slots', () => {
      const actual = [...Prototype.findDescriptors(
        Derived.prototype, 'value')]

      expect(actual[0]).toBe(Derived)
      expect(actual[1].set).toBeDefined()
      expect(actual[1].get).toBeUndefined()
      expect(actual[2]).toBe(Base)
      expect(actual[3].get).toBeDefined()
      expect(actual[3].set).toBeUndefined()
    })

    it('findValues searches readable slots and skips setter-only descriptors', () => {
      const actual = [...Prototype.findValues(Derived.prototype, 'value', {
        instance: new Derived(),
      })]

      expect(actual).toHaveLength(1)
      expect(actual[0].value).toBe('base')
      expect(actual[0].type).toBe('getter')
      expect(actual[0].host).toBe(Base)
    })

    it('hasKey tests prototype-chain key presence', () => {
      expect(Prototype.hasKey(Derived.prototype, 'value')).toBe(true)
    })
  })

  function descriptors(options = { }) {
    return [...Prototype.descriptors(Derived.prototype, {
      ...options,
      filter: (host, key) => key === 'value',
    })].filter(current => typeof current == 'object')
  }

  function values(options = { }) {
    return [...Prototype.values(Derived.prototype, {
      instance: new Derived(),
      ...options,
      filter: (host, key) => key === 'value',
    })]
  }

  function keys(options = { }) {
    return [...Prototype.keys(Derived.prototype, {
      ...options,
      filter: (host, key) => key === 'value',
    })].filter(current => current === 'value')
  }

  function copyTo(options = { }) {
    const target = { }
    Prototype.copyTo(Derived.prototype, target, {
      ...options,
      filter: (host, key) => key === 'value',
    })
    return Object.getOwnPropertyDescriptor(target, 'value')
  }
})
