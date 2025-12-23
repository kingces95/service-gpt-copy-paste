import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { Concept, Implements } from '@kingjs/concept'
import { PartialObject } from '@kingjs/partial-object'
import { PartialClass, Extends } from '@kingjs/partial-class'
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
    expect(fnInfo.isAbstract).toBe(false)
  })
  it('should not be subclass of itself', () => {
    expect(fnInfo.isSubclassOf(fnInfo)).toBe(false)
  })
  it('should not be transparent', () => {
    expect(fnInfo.isTransparentPartialObject).toBe(false)
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

describe('PartialClass', () => {
  const info = Info.from(PartialClass)
  it('should not have an own constructor member', () => {
    const ctorMember = info.getOwnInstanceMember('constructor')
    expect(ctorMember).toBeNull()
  })
  it('should not have a constructor member', () => {
    const ctorMember = info.getInstanceMember('constructor')
    expect(ctorMember).toBeNull()
  })
  it('should not have an own name member', () => {
    const nameMember = info.getOwnStaticMember('name')
    expect(nameMember).toBeNull()
  })
  it('should not have a name member', () => {
    const nameMember = info.getStaticMember('name')
    expect(nameMember).toBeNull()
  })
})

describe('MyClass', () => {
  let cls
  beforeEach(() => {
    [cls] = [class MyClass { }]
  })
  describe('with myMethod', () => {
    let methodClassFn = function methodFn() { }
    beforeEach(() => {
      cls.prototype.myMethod = methodClassFn
    })
    describe('merged with MyPartialClass', () => {
      let info
      let methodFn = function methodFn() { }
      let myPartialClass
      let myPartialClassInfo
      beforeEach(() => {
        myPartialClass = class MyPartialClass extends PartialClass { }
        myPartialClass.prototype.myMethod = methodFn
        myPartialClassInfo = Info.from(myPartialClass)
        PartialReflect.merge(cls, myPartialClass)
        info = Info.from(cls)
      })
      describe('has a merged member', () => {
        let memberInfo
        beforeEach(() => {
          memberInfo = info.getInstanceMember('myMethod')
        })
        it('should report MyClass as host', () => {
          const host = memberInfo.host
          expect(host.equals(info)).toBe(true)
        })
        it('should report no partial class', () => {
          // the partial class myMethod should *not* whack the
          // MyClass myMethod. Proivdes the illusion that MyClass
          // "extends" the PartialClass where extension implies
          // the methods on the most derived class whack inhertied ones.
          const partialClass = memberInfo.partialClass
          // expect(partialClass).toBeNull()
        })
      })
    })
  })
  describe('merged with MyPartialClass', () => {
    let info
    let myPartialClass
    let myPartialClassInfo
    let partialClassFn = function partialClassFn() { }
    beforeEach(() => {
      myPartialClass = class MyPartialClass extends PartialClass { }
      myPartialClass.prototype.myMethod = partialClassFn
      PartialReflect.merge(cls, myPartialClass)
      info = Info.from(cls)
      myPartialClassInfo = Info.from(myPartialClass)
    })
    it('should report having the merged member', () => {
      const member = info.getInstanceMember('myMethod')
      expect(member).not.toBeNull()
    })  
    it('should report being merged directly with MyPartialClass', () => {
      const actual = [...info.ownPartialClasses()]
      const expected = [Info.from(myPartialClass)]
      expect(actual).toEqual(expected)
    })
    describe('has a merged member', () => {
      let memberInfo
      beforeEach(() => {
        memberInfo = info.getInstanceMember('myMethod')
      })
      it('should report MyClass as host', () => {
        const rootHost = memberInfo.host
        expect(rootHost.equals(info)).toBe(true)
      })
      it('should report MyPartialClass as its partialClass', () => {
        const partialClass = memberInfo.partialClass
        expect(partialClass.equals(myPartialClassInfo)).toBe(true)
      })
      it('should report null parent', () => {
        const parent = memberInfo.parent()
        expect(parent).toBeNull()
      })
      it('should be equal to itself', () => {
        expect(memberInfo.equals(memberInfo)).toBe(true)
      })
      it('should not be conceptual', () => {
        expect(memberInfo.isConceptual).toBe(false)
      })
      it('should report no concepts', () => {
        const concepts = [...memberInfo.concepts()]
        expect(concepts).toEqual([])
      })
    })
    describe('and used as an extension to another class', () => {
      let myExtendedClass
      beforeEach(() => {
        myExtendedClass = class MyExtendedClass extends cls { }
        info = Info.from(myExtendedClass)
      })
      it('should report no own partial classes', () => {
        const actual = [...info.ownPartialClasses()]
        const expected = [ ]
        expect(actual).toEqual(expected)
      })
      it('should report being merged indirectly with MyPartialClass', () => {
        const actual = [...info.partialClasses()]
        const expected = [Info.from(myPartialClass)]
        expect(actual).toEqual(expected)
      })
    })
  })
  describe('with MyConcept', () => {
    let myConcept
    let myConceptInfo
    let conceptualFn = function conceptualFn() { }
    beforeEach(() => {
      myConcept = class MyConcept extends Concept { }
      myConcept.prototype.myMethod = conceptualFn
      myConceptInfo = Info.from(myConcept)
    })
    describe('with myExtendedConcept', () => {
      let myExtendedConcept
      let myExtendedConceptInfo
      let extendedConceptualFn = function extendedConceptualFn() { }
      beforeEach(() => {
        myExtendedConcept = class MyExtendedConcept extends Concept {
          static [Implements] = myConcept
        }
        myExtendedConcept.prototype.myMethod = extendedConceptualFn
        myExtendedConceptInfo = Info.from(myExtendedConcept)
      })
      describe('merged with MyExtendedConcept', () => {
        let info
        beforeEach(() => {
          PartialReflect.merge(cls, myExtendedConcept)
          info = Info.from(cls)
        })
        it('should report having the merged member', () => {
          const member = info.getInstanceMember('myMethod')
          expect(member).not.toBeNull()
        })
        it('should report being merged MyExtendedConcept and MyConcept', () => {
          const actual = [...info.ownConcepts()]
          const expected = [
            Info.from(myExtendedConcept),
            Info.from(myConcept)]
          expect(new Set(actual)).toEqual(new Set(expected))
        })
        describe('has a merged member', () => {
          let memberInfo
          beforeEach(() => {
            memberInfo = info.getInstanceMember('myMethod')
          })
          it('should report MyClass as host', () => {
            const rootHost = memberInfo.host
            expect(rootHost.equals(info)).toBe(true)
          })
          it('should report being conceptual', () => {
            expect(memberInfo.isConceptual).toBe(true)
          })
          it('should be abstract', () => {
            expect(memberInfo.isAbstract).toBe(true)
          })
          it('should report MyExtendedConcept ad MyConcept as concept hosts', () => {
            const concepts = [...memberInfo.concepts()]
            const expected = [
              Info.from(myExtendedConcept),
              Info.from(myConcept)]
            expect(new Set(concepts)).toEqual(new Set(expected))
          })
        })
      })
    })
    describe('merged with MyConcept', () => {
      let info
      beforeEach(() => {
        PartialReflect.merge(cls, myConcept)
        info = Info.from(cls)
      })
      it('should report having the merged member', () => {
        const member = info.getInstanceMember('myMethod')
        expect(member).not.toBeNull()
      })
      it('should report being merged directly with MyConcept', () => {
        const actual = [...info.ownConcepts()]
        const expected = [Info.from(myConcept)]
        expect(actual).toEqual(expected)
      })
      describe('has a merged member', () => {
        let memberInfo  
        beforeEach(() => {
          memberInfo = info.getInstanceMember('myMethod')
        })
        it('should report MyClass as host', () => {
          const rootHost = memberInfo.host
          expect(rootHost.equals(info)).toBe(true)
        })
        it('should report being conceptual', () => {
          expect(memberInfo.isConceptual).toBe(true)
        })
        it('should report MyConcept as one of its concepts', () => {
          const concepts = [...memberInfo.concepts()]
          const expected = [Info.from(myConcept)]
          expect(concepts).toEqual(expected)
        })
        it('should report no partial class', () => {
          const partialClass = memberInfo.partialClass
          expect(partialClass).toBeNull()
        })
      })
      describe('and used as an extension to another class', () => {
        let myExtendedClass
        beforeEach(() => {
          myExtendedClass = class MyExtendedClass extends cls { }
          info = Info.from(myExtendedClass)
        })
        it('should report no own concepts', () => {
          const actual = [...info.ownConcepts()]
          const expected = [ ]
          expect(actual).toEqual(expected)
        })
        it('should report being merged indirectly with MyConcept', () => {
          const actual = [...info.concepts()]
          const expected = [Info.from(myConcept)]
          expect(actual).toEqual(expected)
        })
      })
    })
    describe('merged with MyPartialClass then MyConcept', () => {
      let myPartialClass
      let myPartialClassInfo
      let info
      beforeEach(() => {
        myPartialClass = class MyPartialClass extends PartialClass { }
        myPartialClass.prototype.myMethod = conceptualFn
        myPartialClassInfo = Info.from(myPartialClass)
        PartialReflect.merge(cls, myPartialClass)
        PartialReflect.merge(cls, myConcept)
        info = Info.from(cls)
      })
      it('should report being merged with bothMyPartialClass', () => {
        const actualPartialClasses = [...info.ownPartialClasses()]
        const expectedPartialClasses = [myPartialClassInfo]
        expect(actualPartialClasses).toEqual(expectedPartialClasses)
      })
      it('should report being merged with both MyConcept', () => {
        const actualConcepts = [...info.ownConcepts()]
        const expectedConcepts = [Info.from(myConcept)]
        expect(actualConcepts).toEqual(expectedConcepts)
      })
      describe('has a merged member', () => {
        let memberInfo
        beforeEach(() => {
          memberInfo = info.getInstanceMember('myMethod')
        })
        it('should report MyPartialClass as its partialClass', () => {
          const partialClass = memberInfo.partialClass
          expect(partialClass.equals(myPartialClassInfo)).toBe(true)
        })
      })
    })
    describe('merged with MyConcept then MyPartialClass', () => {
      let myPartialClass
      let myPartialClassInfo
      let info
      beforeEach(() => {
        myPartialClass = class MyPartialClass extends PartialClass { }
        myPartialClass.prototype.myMethod = conceptualFn
        myPartialClassInfo = Info.from(myPartialClass)
        PartialReflect.merge(cls, myConcept)
        PartialReflect.merge(cls, myPartialClass)
        info = Info.from(cls)
      })
      it('should report being merged with bothMyPartialClass', () => {
        const actualPartialClasses = [...info.ownPartialClasses()]
        const expectedPartialClasses = [myPartialClassInfo]
        expect(actualPartialClasses).toEqual(expectedPartialClasses)
      })
      it('should report being merged with both MyConcept', () => {
        const actualConcepts = [...info.ownConcepts()]
        const expectedConcepts = [Info.from(myConcept)]
        expect(actualConcepts).toEqual(expectedConcepts)
      })
      describe('has a merged member', () => {
        let memberInfo
        beforeEach(() => {
          memberInfo = info.getInstanceMember('myMethod')
        })
        it('should report MyPartialClass as its partialClass', () => {
          const partialClass = memberInfo.partialClass
          expect(partialClass.equals(myPartialClassInfo)).toBe(true)
        })
      })
    })
  })
})

const PartialObjectMd = {
  create: () => PartialObject,
  toString: '[knownPartialObjectInfo PartialObject]',
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: null,
}

const PartialPojoMd = {
  create: () => PartialPojo,
  toString: '[knownPartialObjectInfo PartialPojo]',
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialObject,
}

const PartialClassMd = {
  create: () => PartialClass,
  toString: '[knownPartialObjectInfo PartialClass]',
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialObject,
}

const ConceptMd = {
  create: () => Concept,
  toString: '[knownPartialObjectInfo Concept]',
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialObject,
}

const MyPartialPojoMd = {
  create: () => {
    const pojo = { }
    return PartialReflect.defineType(pojo)
  },
  toString: '[partialPojoInfo]',
  isTransparent: true,
  isAbstract: true,
  isPartialPojoSubClass: true,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: true,
  base: PartialPojo,
}

const MyPartialClassMd = {
  create: () => {
    return class MyPartialClass extends PartialClass { }
  },
  toString: '[partialClassInfo MyPartialClass]',
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: true,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialClass,
}

const MyConceptMd = {
  create: () => {
    return class MyConcept extends Concept { }
  },
  toString: '[conceptInfo MyConcept]',
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: true,
  isAnonymous: false,
  base: Concept,
}

const Es6Object = {
  create: () => Object,
  toString: '[classInfo Object]',
  isTransparent: false,
  isAbstract: false,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  ownInstanceMembers: [ 
    "constructor",
    "__defineGetter__",
    "__defineSetter__",
    "hasOwnProperty",
    "__lookupGetter__",
    "__lookupSetter__",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toString",
    "valueOf",
    "toLocaleString",
  ],
  ownStaticMembers: [ 
    "length",
    "name",
    "prototype",
    "assign",
    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
    "getOwnPropertyNames",
    "getOwnPropertySymbols",
    "hasOwn",
    "is",
    "preventExtensions",
    "seal",
    "create",
    "defineProperties",
    "defineProperty",
    "freeze",
    "getPrototypeOf",
    "setPrototypeOf",
    "isExtensible",
    "isFrozen",
    "isSealed",
    "keys",
    "entries",
    "fromEntries",
    "values",
    "groupBy",    
  ],
  instanceMembers: [ 
    "constructor",
    "__defineGetter__",
    "__defineSetter__",
    "hasOwnProperty",
    "__lookupGetter__",
    "__lookupSetter__",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toString",
    "valueOf",
    "toLocaleString",
  ],
  staticMembers: [ 
    "length",
    "name",
    "prototype",
    "assign",
    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
    "getOwnPropertyNames",
    "getOwnPropertySymbols",
    "hasOwn",
    "is",
    "preventExtensions",
    "seal",
    "create",
    "defineProperties",
    "defineProperty",
    "freeze",
    "getPrototypeOf",
    "setPrototypeOf",
    "isExtensible",
    "isFrozen",
    "isSealed",
    "keys",
    "entries",
    "fromEntries",
    "values",
    "groupBy",        
  ],
  base: null,
}

const MyClassMd = {
  create: () => {
    return class MyClass { }
  },
  toString: '[classInfo MyClass]',
  isTransparent: false,
  isAbstract: false,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  ownInstanceMembers: [ 'constructor' ],
  ownStaticMembers: [ 'length', 'name', 'prototype' ],
  instanceMembers: [ 
    "constructor",
    "__defineGetter__",
    "__defineSetter__",
    "hasOwnProperty",
    "__lookupGetter__",
    "__lookupSetter__",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toString",
    "valueOf",
    "toLocaleString",
  ],
  staticMembers: [ 'length', 'name', 'prototype' ],
  base: Object,
}

describe('Given', () => {
  describe.each([
    ['Es6Object', Es6Object],
    ['PartialObject', PartialObjectMd],
    ['PartialPojo', PartialPojoMd],
    ['PartialClass',  PartialClassMd],
    ['Concept', ConceptMd],
    ['MyPartialPojo', MyPartialPojoMd],
    ['MyPartialClass', MyPartialClassMd],
    ['MyConcept', MyConceptMd],
    ['MyClass', MyClassMd],
    ])('%s', (_, md) => {
    let info
    beforeEach(() => {
      info = Info.from(md.create())
    })
    it('should have have expected predicates', () => {
      expect(info.isPartialPojoSubClass).toBe(md.isPartialPojoSubClass)
      expect(info.isAbstract).toBe(md.isAbstract)
      expect(info.isTransparentPartialObject).toBe(md.isTransparent)
      expect(info.isPartialClassSubclass).toBe(md.isPartialClassSubclass)
      expect(info.isConceptSubclass).toBe(md.isConceptSubclass)
      expect(info.isAnonymous).toBe(md.isAnonymous)
    })
    it('should have expected toString', () => {
      expect(info.toString()).toBe(md.toString)
    })
    it('should have matching base', () => {
      const expectedBase = md.base
      const base = info.base?.ctor ?? null
      expect(base).toBe(expectedBase)
  
      if (!base) return
      const baseInfo = Info.from(base)
      expect(info.base.equals(baseInfo)).toBe(true)
    })
    it('should be subclass of its base', () => {
      const expectedBase = md.base
      if (!expectedBase) return
      const baseInfo = Info.from(expectedBase)
      expect(info.isSubclassOf(baseInfo)).toBe(true)
    })
    it('should have matching own instance members', () => {
      const expected = md.ownInstanceMembers ?? []
      const members = [...info.ownInstanceMembers()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
    })
    it('should have matching own static members', () => {
      const expected = md.ownStaticMembers ?? []
      const members = [...info.ownStaticMembers()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
    })
    it('should have matching instance members', () => {
      const expected = md.instanceMembers ?? []
      const members = [...info.instanceMembers()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
  
      for (const member of members)
        expect(info.getInstanceMember(member)).not.toBeNull()
    })
    it('should have matching static members', () => {
      const expected = md.staticMembers ?? []
      const members = [...info.staticMembers()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
  
      for (const member of members)
        expect(info.getStaticMember(member)).not.toBeNull()
    })
    it('should have expected members', () => {
      const expected = [
        ...md.instanceMembers ?? [],
        ...md.staticMembers ?? []]
      const members = [...info.members()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
    })
    it('should have own members as union of own static and own instance', () => {
      const expected = [
        ...md.ownInstanceMembers ?? [],
        ...md.ownStaticMembers ?? []]
      const members = [...info.ownMembers()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
    })
    it('should have members as union of static and instance', () => {
      const expected = [
        ...md.instanceMembers ?? [],
        ...md.staticMembers ?? []]
      const members = [...info.members()].map(m => m.name)
      expect(new Set(members)).toEqual(new Set(expected))
    })
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

      // expect base to be object
      expect(fnInfo.base.ctor).toBe(Object)

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

