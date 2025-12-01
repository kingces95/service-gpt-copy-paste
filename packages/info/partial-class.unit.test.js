import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"
import { ExtensionGroup } from '@kingjs/extension-group'

import { abstract } from '@kingjs/abstract'

describe('FunctionInfo for ExtensionGroup', () => {
  let fnInfo
  beforeEach(() => {
    fnInfo = Info.from(ExtensionGroup)
  })
  it('equals itself', () => {
    expect(fnInfo.equals(fnInfo)).toBe(true)
  })
  it('eqauls a different instance of itself', () => {
    expect(fnInfo.equals(Info.from(ExtensionGroup))).toBe(true)
  })
  it('should have a ctor which is ExtensionGroup', () => {
    expect(fnInfo.ctor).toBe(ExtensionGroup)
  })
  describe.each([
    'toString',
    'constructor',  
  ])('%s', (name) => {
    it('is missing', () => {
      const member = fnInfo.getOwnMember(name)
      expect(member).toBeNull()
      const descriptor = fnInfo.getOwnDescriptor(name)
      expect(descriptor).toBeNull()
    })
  })
  it('has ExtensionsInfo as base', () => {
    const ExtensionInfo = Info.MemberCollection
    expect(fnInfo.base).toEqual(ExtensionInfo)
  })
  it('has no static descriptor for missing', () => {
    const descriptor = fnInfo.getOwnDescriptor(
      'missing', { isStatic: true })
  })
  it('has no own names or symbols', () => {
    const names = Array.from(fnInfo.ownNames())
    expect(names).toEqual([])
    const symbols = Array.from(fnInfo.ownSymbols())
    expect(symbols).toEqual([])
  })
  it('has no static names or symbols', () => {
    const names = Array.from(fnInfo.ownNames({ isStatic: true }))
    expect(names).toEqual([])
    const symbols = Array.from(fnInfo.ownSymbols({ isStatic: true }))
    expect(symbols).toEqual([])
  })
})

const MySymbol = Symbol('test-symbol')

function filter(pojo) {
  return filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
    },
    includeStatic: {
      isInherited: true,
      // isSymbol: true,
    }
  })
}

describe('A partial class', () => {
  describe('with a name', () => {
    let cls
    beforeEach(() => {
      cls = class MyClass extends ExtensionGroup { }
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('MyClass, ExtensionGroup')
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class extends ExtensionGroup { }]
    })
    it('has a toString of <anonymous>', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('<anonymous>, ExtensionGroup')
    })
  })

  describe.each([
    ['no members', class extends ExtensionGroup { }, { }],
    ['static data', class extends ExtensionGroup { 
      static myStaticMember = 1 }, {
      // static members are ignored by the DSL
      }],
    ['static getter', class extends ExtensionGroup {
      static get myStaticAccessor() { return 1 } 
    }, { 
      // static members are ignored by the DSL
    }],
    ['instance setter', class extends ExtensionGroup {
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
      const fnInfo = Info.from(cls)
      expect(filter(await fnInfo.__toPojo())).toEqual({
        ...expected,
        base: 'ExtensionGroup'
      })
    })
  })
})


describe('A member', () => {
  describe.each([
    ['abstract member', 'member', { member: abstract },
      'member { value: abstract }' ],
    ['data member', 'member', { member: 1 },
      'member { value: number }' ],
    ['null member', 'member', { member: null },
      'member { value: null }' ],
    ['undefined member', 'member', { member: undefined },
      'member { value: undefined }' ],
    ['boolean member', 'member', { member: true },
      'member { value: boolean }' ],
    ['bigint member', 'member', { member: 10n },
      'member { value: bigint }' ],
    ['symbol member', 'member', { member: MySymbol },
      'member { value: symbol }' ],
    ['array member', 'member', { member: { value: [] } },
      'member { value: array }' ],
    ['const data member', 'member', { 
      member: { value: 1, writable: false } },
      'const member { value: number }' ],
    ['sealed data member', 'member', { 
      member: { value: 1, configurable: false } },
      'sealed member { value: number }' ],
    ['hidden data member', 'member', { 
      member: { value: 1, enumerable: false } },
      'hidden member { value: number }' ],
    ['prototype', 'prototype', class { },
      'static const hidden sealed prototype { value: object }' ],
    ])('%s', (_, name, cls, expected) => {
    it('has a toString', async () => {
      const fnInfo = Info.from(cls)
      const member = fnInfo.getOwnMember(name) 
        ?? fnInfo.getOwnMember(name, { isStatic: true })
      expect(member.toString()).toBe(expected) 
    })
    it('does not equal Object.toString member', async () => {
      const fnInfo = Info.from(cls)
      const member = fnInfo.getOwnMember(name) 
        ?? fnInfo.getOwnMember(name, { isStatic: true })
      const objectFnInfo = Info.from(Object)
      const objectToStringMember = objectFnInfo.getOwnMember('toString')
      expect(member.equals(objectToStringMember)).toBe(false)
    })
  })
})

describe('A bespoke partial class', () => {
  let myPartialClass
  beforeEach(() => {
    [myPartialClass] = [class MyClass extends ExtensionGroup { }]
  })
  describe('that implements MySymbol', () => {
    beforeEach(() => {
      myPartialClass.prototype[MySymbol] = function* () { }
    })  
    it('has a pojo', async () => {
      const pojo = {
        members: { instance: { methods: {
          [MySymbol]: { 
            type: 'method',
            host: 'MyClass',
          },
        } } },
        name: 'MyClass',
        base: 'ExtensionGroup'
      }
      const fnInfo = Info.from(myPartialClass)
      const actual = await fnInfo.__toPojo()
      const actualPojo = filter(actual)
      expect(actualPojo).toEqual(pojo)
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
        base: 'ExtensionGroup'
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
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
        base: 'ExtensionGroup',
        members: { instance: { methods: {
          method: { host: 'MyClass', type: 'method' }
        } } },
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
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
        base: 'ExtensionGroup'
      }
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with instance data members', () => {
    beforeEach(() => {
      myPartialClass.prototype.myInstanceData = 2
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { 
          instance: { data: {
            myInstanceData: {
              host: 'MyClass',
              type: 'data', 
          } } },
        },
        name: 'MyClass',
        base: 'ExtensionGroup'
      }
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with private members', () => {
    beforeEach(() => {
      [myPartialClass] = [class extends ExtensionGroup { 
        myPrivateMethod$() { }
        $myPrivateMethod() { }
        myPrivateMethod_() { }
        _myPrivateMethod() { }
      }]
    })
  
    it('has a pojo', async () => {
      const pojo = {
        base: 'ExtensionGroup'
      }
  
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with a static and instance accessor and method members', () => {
    beforeEach(() => {
      [myPartialClass] = [class extends ExtensionGroup { 
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
          instance: {
            accessors: {
              myAccessor: { type: 'accessor', hasGetter: true, hasSetter: true }
            },
            methods: {
              myMethod: { type: 'method' }
            }
          },
        },
        base: 'ExtensionGroup'
      }
  
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
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
          instance: {
            accessors: {
              myAccessor: { 
                type: 'accessor', 
                host: 'MyClass',
                hasGetter: true, 
                hasSetter: true, 
                isAbstract: true 
              }
            },
            methods: {
              myMethod: { type: 'method', host: 'MyClass', isAbstract: true }
            }
          }
        },
        name: 'MyClass',
        base: 'ExtensionGroup'
      }
      const fnInfo = Info.from(myPartialClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
})

