import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { Concept } from '@kingjs/concept'
import { PartialClass } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialPojo } from '@kingjs/partial-pojo'
import { } from "@kingjs/info-to-pojo"

import { abstract } from '@kingjs/abstract'

describe('Object', () => {
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
  describe('static operations', () => {
    it('should have no static member missing', () => {
      expect(FunctionInfo.getStaticMember(fnInfo, 'missing')).toBeNull()
    })
    it('should have no instance member missing', () => {
      expect(FunctionInfo.getInstanceMember(fnInfo, 'missing')).toBeNull()
    })

    // list of static members that take type and yield results
    describe.each([
      ['instanceMembers', FunctionInfo.instanceMembers],
      ['staticMembers', FunctionInfo.staticMembers],
      ['members', FunctionInfo.members],
      ['concepts', FunctionInfo.concepts],
      ['partialClasses', FunctionInfo.partialClasses],
      ['associatedConcepts', FunctionInfo.associatedConcepts],
    ])('%s', (name, method) => {
      it('should yield the same results as the instance operation', () => {
        const staticResults = [...method(fnInfo)]
        const instanceResults = [...fnInfo[method.name]()]
        expect(staticResults).toEqual(instanceResults)
      })
    })
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

describe('Function', () => {
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
  it('should not be a partial object', () => {
    expect(fnInfo.isPartialObject).toBe(false)
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

describe('PartialPojo', () => {
  let partialPojoInfo
  beforeEach(() => {
    partialPojoInfo = Info.from(PartialPojo)
  })
  it('should be a PartialPojo', () => {
    expect(partialPojoInfo.isPartialPojo).toBe(false)
  })
  it('should be transparent', () => {
    expect(partialPojoInfo.isTransparentPartialObject).toBe(false)
  })
  it('should be a partial object', () => {
    expect(partialPojoInfo.isPartialObject).toBe(false)
  })
})

describe('PartialClass', () => {
  let partialClassInfo
  beforeEach(() => {
    partialClassInfo = Info.from(PartialClass)
  })
  it('should be a PartialClass', () => {
    expect(partialClassInfo.isPartialClass).toBe(false)
  })
  it('should be a partial object', () => {
    expect(partialClassInfo.isPartialObject).toBe(false)
  })
})

describe('Concept', () => {
  let conceptInfo
  beforeEach(() => {
    conceptInfo = Info.from(Concept)
  })
  it('should be a Concept', () => {
    expect(conceptInfo.isConcept).toBe(false)
  })  
  it('should be a partial object', () => {
    expect(conceptInfo.isPartialObject).toBe(false)
  })
})

describe('MyConcept', () => {
  let myConceptInfo
  beforeEach(() => {
    const myConcept = class MyConcept extends Concept { }
    myConceptInfo = Info.from(myConcept)
  })
  it('has a toString of MyConcept', () => {
    expect(myConceptInfo.toString()).toBe('[conceptInfo MyConcept]')
  })
})

describe('MyPartialClass', () => {
  let myPartialClassInfo
  beforeEach(() => {
    const myPartialClass = class MyPartialClass extends PartialClass { }
    myPartialClassInfo = Info.from(myPartialClass)
  })
  it('has a toString of MyExtensionGroup', () => {
    expect(myPartialClassInfo.toString())
      .toBe('[partialClassInfo MyPartialClass]')
  })
  it('should not be transparent', () => {
    expect(myPartialClassInfo.isTransparentPartialObject).toBe(false)
  })
})

describe('MyPartialPojo', () => {
  let myPartialPojoInfo
  beforeEach(() => {
    const pojo = { }
    const myPojo = PartialReflect.defineType(pojo)
    myPartialPojoInfo = Info.from(myPojo)
  })
  it('has a toString of MyPartialClass', () => {
    expect(myPartialPojoInfo.toString()).toBe('[partialPojoInfo]')
  })
  it('should be transparent', () => {
    expect(myPartialPojoInfo.isTransparentPartialObject).toBe(true)
  })
})

describe('MyClass', () => {
  let myClassInfo
  beforeEach(() => {
    const myClass = class MyClass { }
    myClassInfo = Info.from(myClass)
  })
  it('has a toString of MyClass', () => {
    expect(myClassInfo.toString()).toBe('[classInfo MyClass]')
  })
})

describe('A member', () => {
  describe.each([
    ['on MyConcept', 'member', 
      class MyConcept extends Concept { member() { } }, 
      'member, abstract function, [conceptInfo MyConcept]'],
    ['on MyExtensionGroup', 'member', 
      class MyPartialClass extends PartialClass { member() { } }, 
      'member, function, [partialClassInfo MyPartialClass]'],
    ['on MyTransparentPartialObject', 'member',
      PartialReflect.defineType({ member() { } }),
      'member, function, [partialPojoInfo]'],

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

