import { beforeEach } from 'vitest'
import { describe, it, expect } from 'vitest'
import { Info } from "@kingjs/info"
import { extend } from '@kingjs/extend'
import { } from "@kingjs/info-to-pojo"
import { PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

const filter = {
  filter: { isNonPublic: false, isKnown: false },
}

describe('PartialPojo with non-standard properties', () => {
  let pojo
  beforeEach(() => {
    pojo = {
      // writable defaults to false
      writableFalse: { value: 42, writable: false },
      // enumerable defaults to false
      enumerableFalse: { value: 42, enumerable: false },
      // configurable defaults to false
      configurableFalse: { value: 42, configurable: false },
    }
  })
  describe('defined on a class', () => {
    let cls
    beforeEach(() => {
      [cls] = [class { }]
      extend(cls, pojo)
    })

    it('should have and info pojo', async () => {
      const pojo = await Info.from(cls).toPojo(filter)
      expect(pojo).toEqual({
        members: { instance: { data: {
          writableFalse: { type: 'data', isWritable: false },
          enumerableFalse: { type: 'data', isEnumerable: false },
          configurableFalse: { type: 'data', isConfigurable: false },
        } } },
        isAnonymous: true,
        base: 'Object',
      })
    })
  })
})

describe('Kitchen sink', () => {
  describe.each([
    ['class', class extends PartialClass {
      get getter0() { }
      get getter1() { }
      set setter0(value) { }
      set setter1(value) { }
      member0() { return 42}
      member1() { return 42 }
      member2() { return 42 }
    }],
    ['lambda', PartialReflect.defineType({
      getter0: { get: () => { } },
      get getter1() { },

      setter0: { set: (value) => { } },
      set setter1(value) { },

      member0: { value: () => { return 42 } },
      member1() { return 42 },
      member2: () => 42,
    })]
  ])('defined using %s syntax', (_, partialClass) => {
    let expectedMembers
    beforeEach(() => {
      expectedMembers = 
      { 
        instance: { 
          accessors: {
            getter0: { type: 'accessor', hasGetter: true },
            getter1: { type: 'accessor', hasGetter: true },
            setter0: { type: 'accessor', hasSetter: true },
            setter1: { type: 'accessor', hasSetter: true },
          },
          methods: {
            member0: { type: 'method' },
            member1: { type: 'method' },
            member2: { type: 'method' },
          }
        },
      }
    })

    it('should have expected info pojo', async () => {
      const pojo = await Info.from(partialClass).toPojo(filter)
      expect(pojo.members).toEqual(expectedMembers)
    })

    describe('defined on a class', () => {
      let cls
      beforeEach(() => {
        [cls] = [class { }]
        extend(cls, partialClass)
      })
      
      it('should have expected info pojo', async () => {
        const pojo = await Info.from(cls).toPojo(filter)
        expect(pojo).toEqual({
          members: expectedMembers,
          isAnonymous: true,
          base: 'Object',
        })
      })
    })
  })
})
