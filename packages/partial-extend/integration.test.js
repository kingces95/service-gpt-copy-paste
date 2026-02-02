import { beforeEach } from 'vitest'
import { describe, it, expect } from 'vitest'
import { TypeInfo } from "@kingjs/info"
import { extend } from '@kingjs/partial-extend'
import { } from "@kingjs/info-to-pojo"
import { PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

const filter = {
  isNonPublic: false, isKnown: false,
}

describe('Extensions with non-standard properties', () => {
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
      const pojo = await TypeInfo.from(cls).toPojo(filter)
      expect(pojo).toEqual({
        members: { fields: {
          writableFalse: { host: '.', modifiers: [ 'const' ] },
          enumerableFalse: { host: '.', modifiers: [ 'hidden' ] },
          configurableFalse: { host: '.', modifiers: [ 'sealed' ]},
        } },
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
    ['lambda', PartialReflect.load({
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
        getters: {
          getter0: { host: '.', },
          getter1: { host: '.', },
        },
        setters: {
          setter0: { host: '.', },
          setter1: { host: '.', },
        },
        methods: {
          member0: { host: '.' },
          member1: { host: '.' },
          member2: { host: '.' },
        }
      }
    })

    it('should have expected info pojo', async () => {
      const pojo = await TypeInfo.from(partialClass).toPojo(filter)
      expect(pojo.members).toEqual(expectedMembers)
    })

    describe('defined on a class', () => {
      let cls
      beforeEach(() => {
        [cls] = [class { }]
        extend(cls, partialClass)
      })
      
      it('should have expected info pojo', async () => {
        const pojo = await TypeInfo.from(cls).toPojo(filter)
        expect(pojo).toEqual({
          members: expectedMembers,
          isAnonymous: true,
          base: 'Object',
        })
      })
    })
  })
})
