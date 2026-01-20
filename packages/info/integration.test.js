import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info, FunctionInfo } from "@kingjs/info"
import { Concept, Implements } from '@kingjs/concept'
import { PartialObject } from '@kingjs/partial-object'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'
import { PartialPojo } from '@kingjs/partial-pojo'
import { } from "@kingjs/info-to-pojo"
import { toEqualAsSet } from '@kingjs/vitest'

expect.extend({ toEqualAsSet })

import { abstract } from '@kingjs/abstract'

const MySymbol = Symbol('test-symbol')

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
      describe('has a member', () => {
        let memberInfo
        beforeEach(() => {
          memberInfo = info.getMember('myMethod')
        })
        it('should report MyClass as host', () => {
          const host = memberInfo.host
          expect(host.equals(info)).toBe(true)
        })
        it('should report partial class', () => {
          const partialClass = memberInfo.partialClass
          expect(partialClass.equals(myPartialClassInfo)).toBe(true)
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
      const member = info.getMember('myMethod')
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
        memberInfo = info.getMember('myMethod')
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
          const member = info.getMember('myMethod')
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
            memberInfo = info.getMember('myMethod')
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
        const member = info.getMember('myMethod')
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
          memberInfo = info.getMember('myMethod')
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
      it('should report being merged with MyPartialClass', () => {
        const actualPartialClasses = [...info.ownPartialClasses()]
        const expectedPartialClasses = [myPartialClassInfo]
        expect(actualPartialClasses).toEqual(expectedPartialClasses)
      })
      it('should report being merged with MyConcept', () => {
        const actualConcepts = [...info.ownConcepts()]
        const expectedConcepts = [Info.from(myConcept)]
        expect(actualConcepts).toEqual(expectedConcepts)
      })
      describe('has a merged member', () => {
        let memberInfo
        beforeEach(() => {
          memberInfo = info.getMember('myMethod')
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
      it('should report being merged with MyPartialClass', () => {
        const actualPartialClasses = [...info.ownPartialClasses()]
        const expectedPartialClasses = [myPartialClassInfo]
        expect(actualPartialClasses).toEqual(expectedPartialClasses)
      })
      it('should report being merged with MyConcept', () => {
        const actualConcepts = [...info.ownConcepts()]
        const expectedConcepts = [Info.from(myConcept)]
        expect(actualConcepts).toEqual(expectedConcepts)
      })
      describe('has a merged member', () => {
        let memberInfo
        beforeEach(() => {
          memberInfo = info.getMember('myMethod')
        })
        it('should report MyPartialClass as its partialClass', () => {
          const partialClass = memberInfo.partialClass
          expect(partialClass.equals(myPartialClassInfo)).toBe(true)
        })
      })
    })
  })
})

const pojoFilter = {
  ownOnly: false,
  isKnown: false,
  isNonPublic: false,
}

describe('A class', () => {
  describe('with a name', () => {
    let cls
    beforeEach(() => {
      cls = class MyClass { }
    })
    it('has a toString of MyClass', () => {
      const info = Info.from(cls)
      expect(info.toString()).toBe('[classInfo MyClass]')
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class { }]
    })
    it('has a toString of <anonymous>', () => {
      const info = Info.from(cls)
      expect(info.toString()).toBe('[classInfo <anonymous>]')
    })
  })

  describe.each([
    ['no members', class { }, { }],
    ['static data', class { static myStaticMember = 1 }, {
      staticMembers: { fields: {
        myStaticMember: { host: '.' } 
      } },
    }],
    ['instance member', class { myInstanceMember = 1 }, { }],
    ['static getter', class {
      static get myStaticAccessor() { return 1 }
    }, {
      staticMembers: { getters: {
        myStaticAccessor: { host: '.'  }
      } },
    }],
    ['instance setter', class {
      set myInstanceAccessor(value) { }
    }, {
      members: { setters: {
        myInstanceAccessor: { host: '.' }
      } },
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
        members: { methods: {
          [MySymbol]: { 
            host: '.',
          },
        } },
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
        const toStringMember = fnInfo.getOwnMember('toString')
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
        staticMembers: {
          // Instance ctor is known so excluded by filter 
          fields: {
            constructor: { host: '.' }
          }
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
        staticMembers: { fields: {
          myStaticConst: { 
            host: '.',
            modifiers: [ 'sealed', 'const' ],
          }
        } },
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
          fields: {
            myInstanceData: { 
              host: '.', 
          } },
        },
        staticMembers: { fields: {
          myStaticData: { 
            host: '.', 
        } } },
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
          properties: {
            myAccessor: { host: '.' }
          },
          methods: {
            myMethod: { host: '.' }
          },
        },
        staticMembers: {
          properties: {
            myAccessor: { host: '.' }
          },
          methods: {
            myMethod: { host: '.' }
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
        base: 'Object'
      }
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
})

