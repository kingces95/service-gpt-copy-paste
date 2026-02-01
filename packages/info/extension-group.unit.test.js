import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"
import { PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'
import { abstract } from '@kingjs/abstract'

describe('TypeInfo for PartialClass', () => {
  let fn
  let fnInfo
  beforeEach(() => {
    fn = class MyExGrp extends PartialClass { }
    fnInfo = Info.from(fn)
  })
  it('equals itself', () => {
    expect(fnInfo.equals(fnInfo)).toBe(true)
  })
  it('eqauls a different instance of itself', () => {
    expect(fnInfo.equals(Info.from(fn))).toBe(true)
  })
  it('should have a ctor which is PartialClass', () => {
    expect(fnInfo.ctor).toBe(fn)
  })
  describe.each([
    'toString',
    'constructor',  
  ])('%s', (name) => {
    it('is missing', () => {
      const member = fnInfo.getOwnMember(name)
      expect(member).toBeNull()
    })
  })
  it('has ExtensionsInfo as base', () => {
    const ExtensionInfo = Info.PartialType
    expect(fnInfo.base).toEqual(ExtensionInfo)
  })
  it('has no own names or symbols', () => {
    const members = Array.from(fnInfo.ownMembers())
    expect(members).toEqual([])
  })
  it('has no static names or symbols', () => {
    const members = Array.from(fnInfo.ownMembers({ isStatic: true }))
    expect(members).toEqual([])
  })
})

const MySymbol = Symbol('test-symbol')

const pojoFilter = {
  isNonPublic: false,
  isKnown: false,
}

describe('A PartialClass', () => {
  describe('with a name', () => {
    let cls
    beforeEach(() => {
      cls = class MyPartialClass extends PartialClass { }
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe(
        '[partialClassInfo MyPartialClass]')
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class extends PartialClass { }]
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe(
        '[partialClassInfo <anonymous>]')
    })
    it('Info.from does not throw', () => {
      expect(() => Info.from(cls)).not.toThrow()
    })
  })
})

describe('A member', () => {
  describe.each([
    ['abstract member', 'member', { member: abstract },
      'member, abstract method, [partialPojoInfo]' ],
    ['data member', 'member', { member: 1 },
      'member, field [number], [partialPojoInfo]' ],
    ['null member', 'member', { member: null },
      'member, field [null], [partialPojoInfo]' ],
    ['undefined member', 'member', { member: undefined },
      'member, field [undefined], [partialPojoInfo]' ],
    ['boolean field [member]', 'member', { member: true },
      'member, field [boolean], [partialPojoInfo]' ],
    ['bigint member', 'member', { member: 10n },
      'member, field [bigint], [partialPojoInfo]' ],
    ['symbol member', 'member', { member: MySymbol },
      'member, field [symbol], [partialPojoInfo]' ],
    ['array member', 'member', { member: { value: [] } },
      'member, field [array], [partialPojoInfo]' ],
    ['const data member', 'member', { 
      member: { value: 1, writable: false } },
      'member, const field [number], [partialPojoInfo]' ],
    ['sealed data member', 'member', { 
      member: { value: 1, configurable: false } },
      'member, sealed field [number], [partialPojoInfo]' ],
    ['hidden data member', 'member', { 
      member: { value: 1, enumerable: false } },
      'member, hidden field [number], [partialPojoInfo]' ],
    // ['prototype', 'prototype', class { },
    //   'static const hidden sealed prototype { value: object }' ],
    ])('%s', (_, name, cls, expected) => {
    it('has a toString', async () => {
      const fnInfo = Info.from(PartialReflect.load(cls))
      const member = fnInfo.getOwnMember(name) 
        ?? fnInfo.getOwnStaticMember(name)
      expect(member.toString()).toBe(expected) 
    })
    it('does not equal Object.toString member', async () => {
      const fnInfo = Info.from(PartialReflect.load(cls))
      const member = fnInfo.getOwnMember(name) 
        ?? fnInfo.getOwnStaticMember(name)
      const objectFnInfo = Info.from(Object)
      const objectToStringMember = objectFnInfo.getOwnMember('toString')
      expect(member.equals(objectToStringMember)).toBe(false)
    })
  })
})

describe('A prototype member', () => {
  let type
  let prototypeMember
  beforeEach(() => {
    type = class { }
    const fnInfo = Info.from(type)
    prototypeMember = fnInfo.getOwnStaticMember('prototype')
  })
  it('is missing', () => {
    expect(prototypeMember).toBeNull()
  })
  // it('has a toString', () => {
  //   expect(prototypeMember.toString()).toBe(
  //     'prototype, static known sealed const hidden object, [classInfo type]')
  // })
})

describe('A bespoke partial class', () => {
  let myPartialClass
  beforeEach(() => {
    [myPartialClass] = [class MyClass extends PartialClass { }]
  })
  describe('that implements MySymbol', () => {
    beforeEach(() => {
      myPartialClass.prototype[MySymbol] = function* () { }
    })  
    it('has a pojo', async () => {
      const pojo = {
        members: { methods: {
          [MySymbol]: { 
            host: '.',
          },
        } },
        name: 'MyClass',
        base: 'PartialClass'
      }
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })  
  describe('with static and explicit constructor members', () => {
    beforeEach(() => {
      myPartialClass.constructor = function() { }
      myPartialClass.prototype.constructor = function() { }
    })
    it('has a pojo', async () => {
      const pojo = {
        name: 'MyClass',
        base: 'PartialClass'
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with static and instance members', () => {
    beforeEach(() => {
      myPartialClass.method = function() { }
      myPartialClass.prototype.method = function() { }
    })
    it('has a pojo that ignores the static member', async () => {
      const pojo = {
        name: 'MyClass',
        base: 'PartialClass',
        members: { methods: {
          method: { host: '.' }
        } },
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with static const member', () => {
    beforeEach(() => {
      myPartialClass.myStaticConst = 1

      // clear configurable and writable
      Object.defineProperty(myPartialClass, 'myStaticConst', {
        configurable: false,
        writable: false,
      })
    })
    it('has a pojo that ignores the static data member', async () => {
      const pojo = {
        name: 'MyClass',
        base: 'PartialClass'
      }
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with instance data members', () => {
    beforeEach(() => {
      myPartialClass.prototype.myInstanceData = 2
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { 
          fields: {
            myInstanceData: {
              host: '.',
          } },
        },
        name: 'MyClass',
        base: 'PartialClass'
      }
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with private members', () => {
    beforeEach(() => {
      [myPartialClass] = [class MyEg extends PartialClass { 
        myPrivateMethod$() { }
        $myPrivateMethod() { }
        myPrivateMethod_() { }
        _myPrivateMethod() { }
      }]
    })
  
    it('has a pojo', async () => {
      const pojo = {
        base: 'PartialClass',
        name: 'MyEg',
      }
  
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with a static and instance accessor and method members', () => {
    beforeEach(() => {
      [myPartialClass] = [class MyEg extends PartialClass { 
        static get myAccessor() { }
        static set myAccessor(value) { }
        static myMethod() { }
        
        get myAccessor() { }
        set myAccessor(value) { }
        myMethod() { }
      }]
    })
  
    it('has a pojo', async () => {
      const pojo = {
        members: {
          properties: {
            myAccessor: { host: '.' }
          },
          methods: {
            myMethod: { host: '.' }
          }
        },
        base: 'PartialClass',
        name: 'MyEg',
      }
  
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with an abstract method and accessor', () => {
    beforeEach(() => {
      // assign abstract to method and accessor
      Object.defineProperties(myPartialClass.prototype, {
        myAccessor: {
          get: abstract,
          set: abstract,
          configurable: true,
        },
        myMethod: {
          value: abstract,
          configurable: true,
          writable: true,
        },
      })
    })
    it('has a pojo', async () => {
      const pojo = {
        members: {
          properties: {
            myAccessor: { 
              host: '.',
              isAbstract: true 
            }
          },
          methods: {
            myMethod: { host: '.', isAbstract: true }
          }
        },
        name: 'MyClass',
        base: 'PartialClass'
      }
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
})

