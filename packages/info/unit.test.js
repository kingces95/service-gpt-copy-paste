import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { Concept } from '@kingjs/concept'
import { ExtensionGroup } from '@kingjs/extension-group'
import { PartialClass } from '@kingjs/partial-class'
import { } from "@kingjs/info-to-pojo"

import { abstract } from '@kingjs/abstract'

describe('FunctionInfo for Object', () => {
  let fnInfo
  beforeEach(() => {
    fnInfo = Info.from(Object)
  })
  it('should have a ctor which is Object', () => {
    expect(fnInfo.ctor).toBe(Object)
  })
  it('does not equal null', () => {
    expect(fnInfo.equals(null)).toBe(false)
  })
  it('does not have a member missing', () => {
    expect(fnInfo.getOwnInstanceMember('missing')).toBeNull()
    expect(FunctionInfo.getInstanceMember(fnInfo, 'missing')).toBeNull()
  })
  describe('has a toString member', () => {
    let toStringMember
    beforeEach(() => {
      toStringMember = fnInfo.getOwnInstanceMember('toString')
    })
    it('has no root type', () => {
      const rootType = toStringMember.rootHost()
      expect(rootType).toBeNull()
    })
  })
  describe('has a constructor member', () => {
    let ctorMember
    beforeEach(() => {
      ctorMember = fnInfo.getOwnInstanceMember('constructor')
    })

    it('equals itself', () => {
      expect(ctorMember.equals(ctorMember)).toBe(true)
    })
    it('equals a different instance of itself', () => {
      expect(ctorMember.equals(
        fnInfo.getOwnInstanceMember('constructor'))).toBe(true)
    })
    it('does not equal null', () => {
      expect(ctorMember.equals(null)).toBe(false)
    })

    describe('has a hasOwnProperty member', () => {
      let hasOwnPropertyMember
      beforeEach(() => {
        hasOwnPropertyMember = fnInfo.getOwnInstanceMember('hasOwnProperty')
      })
      it('does not equal the constructor member', () => {
        expect(hasOwnPropertyMember.equals(ctorMember)).toBe(false)
      })
    })
  })
})

const MySymbol = Symbol('test-symbol')

describe('FunctionInfo for Function', () => {
  let fnInfo
  beforeEach(() => {
    fnInfo = Info.from(Function)
  })
  it('should have a ctor which is Function', () => {
    expect(fnInfo.ctor).toBe(Function)
  })
  it('should have Object as base', () => {
    const objectInfo = Info.Object
    expect(fnInfo.base.equals(objectInfo)).toBe(true)
  })
  describe('static members', () => {
    let staticMembers
    beforeEach(() => {
      staticMembers = [...fnInfo.ownStaticMembers()]
    })
    it('should all be known', () => {
      for (const member of staticMembers)
        expect(member.isKnown).toBe(true)
    })
  })
  describe('instance members', () => {
    let instanceMembers
    beforeEach(() => {
      instanceMembers = [...fnInfo.ownInstanceMembers()]
    })
    it('should all be known', () => {
      for (const member of instanceMembers)
        expect(member.isKnown).toBe(true)
    })
  })
})

describe('My concept', () => {
  let myConcept
  beforeEach(() => {
    myConcept = class MyConcept extends Concept { }
  })
  it('has a toString of MyConcept', () => {
    const conceptInfo = Info.from(myConcept)
    expect(conceptInfo.toString()).toBe('[conceptInfo MyConcept]')
  })
})

describe('My extension group', () => {
  let myExtensionGroup
  beforeEach(() => {
    myExtensionGroup = class MyExtensionGroup extends ExtensionGroup { }
  })
  it('has a toString of MyExtensionGroup', () => {
    const extensionGroupInfo = Info.from(myExtensionGroup)
    expect(extensionGroupInfo.toString()).toBe('[extensionGroupInfo MyExtensionGroup]')
  })
})

describe('My partial class', () => {
  let myPartialClass
  beforeEach(() => {
    const pojo = { }
    myPartialClass = PartialClass.fromArg(pojo)
  })
  it('has a toString of MyPartialClass', () => {
    const partialClassInfo = Info.from(myPartialClass)
    expect(partialClassInfo.toString()).toBe('[partialClassInfo]')
  })
})

describe('A member', () => {
  describe.each([
    ['on MyConcept', 'member', 
      class MyConcept extends Concept { member() { } }, 
      'member, abstract function, [conceptInfo MyConcept]'],
    ['on MyExtensionGroup', 'member', 
      class MyExtensionGroup extends ExtensionGroup { member() { } }, 
      'member, function, [extensionGroupInfo MyExtensionGroup]'],
    ['on MyPartialClass', 'member',
      PartialClass.fromArg({ member() { } }),
      'member, function, [partialClassInfo]'],

    ['on MyClass', 'member', class MyClass { member() { } }, 
      'member, function, [classInfo MyClass]'],
    ['constructor', 'constructor', class MyClass { constructor() { } },
      'constructor, hidden { value: [class] }, [classInfo MyClass]'],
    ['on anonnymous', 'member', class { member() { } }, 
      'member, function, [classInfo <anonymous>]'],
    ['static on MyClass', 'member', class MyClass { static member() { } },
      'member, static function, [classInfo MyClass]'],
    ['with symbol name', MySymbol, class MyClass { [MySymbol]() { } },
      '[Symbol(test-symbol)], function, [classInfo MyClass]'],
    ['static with symbol name', MySymbol, class MyClass { static [MySymbol]() { } },
      '[Symbol(test-symbol)], static function, [classInfo MyClass]'],
    ['getter on MyClass', 'member', class MyClass { 
      get member() { } 
      set member(value) { }
    }, 'member, { get; set }, [classInfo MyClass]'],
    ])('%s', (_, name, cls, expected) => {
    it('has a toString', async () => {
      const fnInfo = Info.from(cls)
      const member = fnInfo.getOwnInstanceMember(name) 
        ?? fnInfo.getOwnStaticMember(name)
      expect(member.toString()).toBe(expected) 
    })
    it('does not equal Object.toString member', async () => {
      const fnInfo = Info.from(cls)
      const member = fnInfo.getOwnInstanceMember(name) 
        ?? fnInfo.getOwnStaticMember(name)
      const objectFnInfo = Info.from(Object)
      const objectToStringMember = 
        objectFnInfo.getOwnInstanceMember('toString')
      expect(member.equals(objectToStringMember)).toBe(false)
    })
  })
})

const pojoFilter = {
    ownOnly: false,
    filter: [{ 
      isStatic: true,
      isKnown: false,
      isNonPublic: false,
    }, {
      isStatic: false,
      isKnown: false,
      isNonPublic: false,
    }],
  }

describe('A class', () => {
  describe('with a name', () => {
    let cls
    beforeEach(() => {
      cls = class MyClass { }
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('[classInfo MyClass]')
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class { }]
    })
    it('has a toString of <anonymous>', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('[classInfo <anonymous>]')
    })
  })

  describe.each([
    ['no members', class { }, { }],
    ['static data', class { static myStaticMember = 1 }, {
      members: { static: { data: {
        myStaticMember: { type: 'data' } 
      } } },
    }],
    ['instance member', class { myInstanceMember = 1 }, { }],
    ['static getter', class {
      static get myStaticAccessor() { return 1 }
    }, {
      members: { static: { accessors: {
        myStaticAccessor: { type: 'accessor', hasGetter: true  }
      } } },
    }],
    ['instance setter', class {
      set myInstanceAccessor(value) { }
    }, {
      members: { instance: { accessors: {
        myInstanceAccessor: { type: 'accessor', hasSetter: true }
      } } },
    }],
  ])('with %s', (description, cls, expected) => {
    it('has a pojo', async () => {
      const fnInfo = Info.from(cls)
      const pojo = await fnInfo.toPojo(pojoFilter)
      expected.isAnonymous = true
      expect(pojo).toEqual({
        ...expected,
        base: 'Object',
      })
    })
  })
})

describe('A bespoke class', () => {
  let myClass
  beforeEach(() => {
    [myClass] = [class { }]
  })
  describe('that implements MySymbol', () => {
    beforeEach(() => {
      // myClass.prototype[MySymbol] = function* () { }, but not enumerable
      Object.defineProperty(myClass.prototype, MySymbol, {
        value: function* () { },
        writable: true,
        configurable: true,
        enumerable: false,
      })
    })  
    it('has a pojo', async () => {
      const pojo = {
        isAnonymous: true,
        members: { instance: { methods: {
          [MySymbol]: { 
            type: 'method',
            // isEnumerable: true
          },
        } } },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })  
  describe('extended by an extended class', () => {
    let myExtendedClass
    beforeEach(() => {
      [myExtendedClass] = [class extends myClass { }]
    })
    describe('which overrides toString on both the base and extended class', () => {
      beforeEach(() => {
        myClass.prototype.toString = function() { 
          return 'myClass' }
        myExtendedClass.prototype.toString = function() { 
          return 'myExtendedClass' }
      })

      it('should have Object as root of toString', async () => {
        const fnInfo = Info.from(myExtendedClass)
        const toStringMember = fnInfo.getOwnInstanceMember('toString')
        const object = FunctionInfo.Object
        expect(toStringMember.rootHost().equals(object)).toBe(true)
        expect(toStringMember.rootHost().name).toBe('Object')
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
        isAnonymous: true,
        members: {
          // Instance ctor is known so excluded by filter 
          // instance: { methods: {
          //   constructor: { type: 'method', rootHost: 'Object' } 
          // } },
          static: { data: {
            constructor: { type: 'data' }
          } }
        },
        base: 'Object'
      }

      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
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
        isAnonymous: true,
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
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
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
        isAnonymous: true,
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
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
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
        isAnonymous: true,
        base: 'Object'
      }
  
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
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
        isAnonymous: true,
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
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
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
        isAnonymous: true,
        members: {
          instance: {
            accessors: {
              myAccessor: { 
                type: 'accessor', 
                hasGetter: true, 
                hasSetter: true, 
                isAbstract: true 
              }
            },
            methods: {
              myMethod: { type: 'method', isAbstract: true }
            }
          }
        },
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
})

