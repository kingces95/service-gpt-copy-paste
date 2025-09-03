import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { FunctionInfo, Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"
import { PartialClass } from '@kingjs/partial-class'
import { Concept } from '@kingjs/concept'

import { abstract } from '@kingjs/abstract'

describe('FunctionInfo for Concept', () => {
  let fnInfo
  beforeEach(() => {
    fnInfo = Info.from(Concept)
  })
  it('equals itself', () => {
    expect(fnInfo.equals(fnInfo)).toBe(true)
  })
  it('eqauls a different instance of itself', () => {
    expect(fnInfo.equals(Info.from(Concept))).toBe(true)
  })
  it('should have a ctor which is Concept', () => {
    expect(fnInfo.ctor).toBe(Concept)
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
  it('has Concept base', () => {
    const PartialClassInfo = FunctionInfo.PartialClass
    expect(fnInfo.base).toEqual(PartialClassInfo)
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
  it('has no own declared concepts', () => {
    const concepts = Array.from(fnInfo.ownDeclaredConcepts())
    expect(concepts).toEqual([])
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
      cls = class MyClass extends PartialClass { }
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('MyClass, PartialClass')
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class extends PartialClass { }]
    })
    it('has a toString of <anonymous>', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('<anonymous>, PartialClass')
    })
  })

  describe.each([
    ['no members', class extends PartialClass { }, { }],
    ['static data', class extends PartialClass { 
      static myStaticMember = 1 }, {
      // static members are ignored by the DSL
      }],
    ['static getter', class extends PartialClass {
      static get myStaticAccessor() { return 1 } 
    }, { 
      // static members are ignored by the DSL
    }],
    ['instance setter', class extends PartialClass {
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
        base: 'PartialClass'
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
  let myClass
  beforeEach(() => {
    [myClass] = [class MyClass extends PartialClass { }]
  })
  describe('that implements MySymbol', () => {
    beforeEach(() => {
      myClass.prototype[MySymbol] = function* () { }
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
        base: 'PartialClass'
      }
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.__toPojo()
      const actualPojo = filter(actual)
      expect(actualPojo).toEqual(pojo)
    })
  })  
  describe('extended by an extended class', () => {
    let myExtendedClass
    beforeEach(() => {
      myExtendedClass = class MyExtendedClass extends myClass { }
    })
    describe('which overrides toString on both the base and extended class', () => {
      beforeEach(() => {
        myClass.prototype.toString = function() { 
          return 'myClass' }
        myExtendedClass.prototype.toString = function() { 
          return 'myExtendedClass' }
      })

      it('should have MyClass as root of toString', async () => {
        const fnInfo = Info.from(myExtendedClass)
        const toStringMember = fnInfo.getOwnMember('toString')
        const rootHost = toStringMember.rootHost()
        expect(rootHost.name).toBe('MyClass')
        expect(rootHost.equals(Info.from(myClass))).toBe(true)
      })
    })
  }) 
  describe('with static and explicit constructor members', () => {
    beforeEach(() => {
      myClass.constructor = function() { }
      myClass.prototype.constructor = function() { }
    })
    it('has a pojo', async () => {
      const pojo = {
        name: 'MyClass',
        base: 'PartialClass'
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with static const member', () => {
    beforeEach(() => {
      [myClass] = [class {
        static myStaticConst = 1
      }]
      // clear configurable and writable
      Object.defineProperty(myClass, 'myStaticConst', {
        configurable: false,
        writable: false,
      })
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { static: { data: {
          myStaticConst: { 
            type: 'data',
            isConfigurable: false,
            isWritable: false,
          }
        } } },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with static and instance data members', () => {
    beforeEach(() => {
      [myClass] = [class { 
        static myStaticData = 1
      }]
      myClass.prototype.myInstanceData = 2
    })
    it('has a pojo', async () => {
      const pojo = {
        members: { 
          instance: { data: {
            myInstanceData: { 
              type: 'data', 
          } } },
          static: { data: {
            myStaticData: { 
              type: 'data', 
          } } },
        },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with private members', () => {
    beforeEach(() => {
      [myClass] = [class { 
        myPrivateMethod$() { }
        $myPrivateMethod() { }
        myPrivateMethod_() { }
        _myPrivateMethod() { }
      }]
    })
  
    it('has a pojo', async () => {
      const pojo = {
        base: 'Object'
      }
  
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with a static and instance accessor and method members', () => {
    beforeEach(() => {
      [myClass] = [class { 
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
          static: {
            accessors: {
              myAccessor: { type: 'accessor', hasGetter: true, hasSetter: true }
            },
            methods: {
              myMethod: { type: 'method' }
            }
          }
        },
        base: 'Object'
      }
  
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with an abstract method and accessor', () => {
    beforeEach(() => {
      // assign abstract to method and accessor
      Object.defineProperties(myClass.prototype, {
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
        base: 'PartialClass'
      }
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
})

