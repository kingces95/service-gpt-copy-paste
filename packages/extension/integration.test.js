import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"
import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Extension } from '@kingjs/extension'
import { extend } from '@kingjs/extend'
import { filterInfoPojo } from "@kingjs/info-to-pojo"

function filter(pojo) {
  return filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
    },
    includeStatic: {
      isInherited: true,
    }
  })
}

describe('Extension', () => {
  describe('data members with non-standard properties', () => {
    let conciseDefinition
    beforeEach(() => {
      conciseDefinition = {
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
        extend(cls, conciseDefinition)
      })

      it('should have and info pojo', async () => {
        const pojo = filter(await Info.from(cls).__toPojo())
        expect(pojo).toEqual({
          members: { instance: { data: {
            writableFalse: { type: 'data', isWritable: false },
            enumerableFalse: { type: 'data', isEnumerable: false },
            configurableFalse: { type: 'data', isConfigurable: false },
          } } },
          base: 'Object',
        })
      })
    })
  })
  describe('kitchen sink', () => {
    describe.each([
      ['class', class extends Extension {
        get getter0() { }
        get getter1() { }
        set setter0(value) { }
        set setter1(value) { }
        member0() { return 42}
        member1() { return 42 }
        member2() { return 42 }
      }],
      ['concise', {
        getter0: { get: () => { } },
        get getter1() { },
  
        setter0: { set: (value) => { } },
        set setter1(value) { },
  
        member0: { value: () => { return 42 } },
        member1() { return 42 },
        member2: () => 42,
      }]
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
        const pojo = filter(await Info.from(partialClass).__toPojo())
        expect(pojo).toEqual({
          members: expectedMembers,
          base: 'Extension',
        })
      })

      describe('defined on a class', () => {
        let cls
        beforeEach(() => {
          [cls] = [class { }]
          extend(cls, partialClass)
        })
        
        it('should have expected info pojo', async () => {
          const pojo = filter(await Info.from(cls).__toPojo())
          expect(pojo).toEqual({
            members: expectedMembers,
            base: 'Object',
          })
        })
      })
    })
  })
})
