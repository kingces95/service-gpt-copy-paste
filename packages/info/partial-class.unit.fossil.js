import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { TypeInfo, TypeInfo } from "@kingjs/info"
import { PartialClass, Defines } from '@kingjs/partial-class'
import { extend } from '@kingjs/partial-extend'
import { abstract } from '@kingjs/abstract'
import { } from "@kingjs/info-to-pojo"
import { From } from '@kingjs/partial-symbols'

function getMemberValue(cls) {
  const info = TypeInfo.from(cls)
  const member = info.getMember('member')
  const value = member?.method
  return value
}

const pojoFilter = {
  isNonPublic: false,
  isKnown: false,
}

const base = { base: 'Attachments' }

describe('A partial class', () => {
  describe.each([
    ['no members', { }, { ...base }],
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
      ...base,
      members: { setters: {
        myInstanceAccessor: { host: '.' }
      } },
    }],
    ['data', { myData: 1 }, { 
      ...base,
      members: { fields: {
        myData: { host: '.', fieldType: 'number' } 
      } },
    }],
    ['abstract method', { myMethod: abstract }, { 
      ...base,
      members: { methods: {
        myMethod: { host: '.', isAbstract: true } 
      } }
    }],
    ['descriptor member', { myMethod: { value: 1 } }, {
      ...base,
      members: { fields: {
        myMethod: { host: '.', fieldType: 'number'} 
      } },
    }],
    ['const field', { myField: { value: 3.141, writable: false } }, {
      ...base,
      members: { fields: {
        myField: { host: '.', modifiers: [ 'const' ], fieldType: 'number' } 
      } },
    }],
  ])('with %s', (_, cls, expected) => {
    it('has a pojo', async () => {From](cls)
      const fnInfo = TypeInfo.from(partialClass)
      const actual = await fnInfo.toPojo(pojoFilter) 
      expect(actual).toEqual({
        ...expected,
        isAnonymous: true,
        isAbstract: true,
      })
    })
  })
})

describe('A class with a member', () => {
  let cls
  let myMemberFn = function classFn() { }
  beforeEach(() => {
    [cls] = [class { }]
    cls.prototype.member = myMemberFn
  })
  describe('with a PartialClass', () => {
    let myPartialClass
    let myPartialMemberFn = function myPartialMemberFn() { }
    beforeEach(() => {
      myPartialClass = class MyEx extends PartialClass { }
      myPartialClass.prototype.member = myPartialMemberFn
    })
    it('should overwrite member when merged', async () => {
      extend(cls, myPartialClass)
      const fn = getMemberValue(cls)
      expect(fn).toBe(myPartialMemberFn)
    })
  })
})

describe('A PartialClass with a member', () => {
  let myPartialClass
  let myPartialMemberFn = function myPartialMemberFn() { }
  beforeEach(() => {
    myPartialClass = class MyEx extends PartialClass { }
    myPartialClass.prototype.member = myPartialMemberFn
  })
  describe('extended by a PartialClass', () => {
    let mySubPartialMemberFn = function partialClassFn() { }
    beforeEach(() => {
      myPartialClass[Defines] =  { member: mySubPartialMemberFn }
    })
    it('should not overwrite member', async () => {
      const fn = getMemberValue(myPartialClass)
      expect(fn).toBe(myPartialMemberFn)
    })
  })
})
