import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { PartialClass, Extensions } from '@kingjs/partial-class'
import { extend } from '@kingjs/extend'
import { TransparentPartialClass } from '@kingjs/transparent-partial-class'
import { abstract } from '@kingjs/abstract'
import { } from "@kingjs/info-to-pojo"
import { PartialReflect } from '@kingjs/partial-reflect'

function getMemberValue(cls) {
  const info = Info.from(cls)
  const member = FunctionInfo.getInstanceMember(info, 'member')
  const value = member?.value
  return value
}

const pojoFilter = {
  filter: {
    isNonPublic: false,
    isKnown: false,
  }
}

describe('A partial class', () => {
  describe.each([
    ['no members', { }, { }],
    // ['static data', class MyEg extends PartialClass { 
    //   static myStaticMember = 1 }, {
    //   // static members are ignored by the DSL
    //   }],
    // ['static getter', class MyEg extends PartialClass {
    //   static get myStaticAccessor() { return 1 } 
    // }, { 
    //   // static members are ignored by the DSL
    // }],
    ['instance setter', {
      set myInstanceAccessor(value) { }
    }, {
      members: { instance: { accessors: {
        myInstanceAccessor: { type: 'accessor', hasSetter: true }
      } } },
    }],
    ['data', { myData: 1 }, { 
      members: { instance: { data: {
        myData: { type: 'data' } 
      } } },
    }],
    ['abstract method', { myMethod: abstract }, { 
      members: { instance: { methods: {
        myMethod: { type: 'method', isAbstract: true } 
      } } }
    }],
    ['descriptor member', { myMethod: { value: 1 } }, {
      members: { instance: { data: {
        myMethod: { type: 'data' } 
      } } },
    }],
    ['const field', { myField: { value: 3.141, writable: false } }, {
      members: { instance: { data: {
        myField: { type: 'data', isWritable: false } 
      } } },
    }],
  ])('with %s', (_, cls, expected) => {
    it('has a pojo', async () => {
      const partialClass = PartialReflect.defineType(cls)
      const fnInfo = Info.from(partialClass)
      const actual = await fnInfo.toPojo(pojoFilter) 
      expect(actual).toEqual({
        ...expected,
        base: 'TransparentPartialClass',
        isAnonymous: true,
      })
    })
  })
})

describe('A class with a member', () => {
  let cls
  beforeEach(() => {
    [cls] = [class { member() { } }]
  })
  describe('and an extension member', () => {
    let extensions
    let extensionFn = function extensionFn() { }
    beforeEach(() => {
      extensions = class MyEx extends PartialClass { }
      extensions.prototype.member = extensionFn
    })
    it('when merged should overwrite the member', async () => {
      extend(cls, extensions)
      const extension = getMemberValue(extensions)
      const clsMember = getMemberValue(cls)
      expect(clsMember).toBe(extensionFn)
      expect(extension).toBe(extensionFn)
    })
    describe('and a partial class member', () => {
      let partialClassFn = function partialClassFn() { }
      beforeEach(() => {
        extensions[Extensions] =  { member: partialClassFn }
      })
      it('should have an own partial class', () => {
        const partialClass = [...PartialReflect.ownExtensions(extensions)]
        expect(partialClass).toHaveLength(1)
        expect(partialClass[0].prototype).instanceOf(TransparentPartialClass)
      })
      it('when merged should use the partial class member', async () => {

        // check runtime behavior
        extend(cls, extensions)
        const clsMember = getMemberValue(cls)
        expect(clsMember).toBe(extensionFn)
        
        // check reflection behavior
        const partialMember = getMemberValue(extensions)
        expect(partialMember).not.toBe(partialClassFn)
        expect(partialMember).toBe(extensionFn)
      })
      it('should have partial names as a subset of class names', async () => {
        const partialNames = [
          ...Info.from(extensions).instanceMembers()].map(m => m.name)
        const clsNames = [
          ...Info.from(cls).instanceMembers()].map(m => m.name)
        for (const name of partialNames)
          expect(clsNames).toContain(name)
      })
    })
  })
})
