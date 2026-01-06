import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Info } from "@kingjs/info"
import { PartialClass } from '@kingjs/partial-class'
import { extend } from '@kingjs/extend'
import { implement } from '@kingjs/implement'
import { Concept, Implements } from '@kingjs/concept'
import { } from "@kingjs/info-to-pojo"

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
  it('is not a partial class', () => {
    expect(!fnInfo.isPartialObject).toBe(true)
  })
  it('is a concept', () => {
    expect(fnInfo.isConceptSubclass).toBe(false)
  })
  it('has no declared or inherited concepts', () => {
    const concepts = fnInfo.concepts()
    expect(Array.from(concepts)).toEqual([])
  })
  it('has PartialPojoInfo base', () => {
    const ExtensionInfo = Info.PartialObject
    expect(fnInfo.base).toEqual(ExtensionInfo)
  })
})

const MySymbol = Symbol('test-symbol')

const pojoFilter = {
  ownOnly: false,
  filter: {
      isNonPublic: false,
      isKnown: false,
    }
  }

describe('A concept', () => {
  describe('with a name', () => {
    let cls
    beforeEach(() => {
      cls = class MyClass extends Concept { }
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('[conceptInfo MyClass]')
    })
    describe('info', () => {
      let fnInfo
      beforeEach(() => {
        fnInfo = Info.from(cls)
      })
      it('is a concept', () => {
        expect(fnInfo.isConceptSubclass).toBe(true)
      })
      describe.each([
        'toString',
        'constructor',  
      ])('%s', (name) => {
        it('is missing', () => {
          const member = fnInfo.getOwnInstanceMember(name)
          expect(member).toBeNull()
        })
      })
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class extends PartialClass { }]
    })
    it('does not throws', () => {
      expect(() => Info.from(cls)).not.toThrow()
    })
  })

  describe.each([
    ['no members', class MyConcept extends Concept { }, { }],
    ['static data', class MyConcept extends Concept { 
      static member = 1 }, {
      // static members are ignored by the DSL
    }],
    ['static getter', class MyConcept extends Concept {
      static get member() { return 1 } 
    }, { 
      // static members are ignored by the DSL
    }],
    ['instance setter', class MyConcept extends Concept {
      set member(value) { }
    }, 
    {
      members: { instance: { setters: {
        member: { 
          host: '.',
          isAbstract: true
        }
      } } },
    }],
  ])('with %s', (_, cls, expected) => {
    it('has a pojo', async () => {
      const info = Info.from(cls)
      const members = [...info.members()]
      expect(await info.toPojo(pojoFilter)).toEqual({
        ...expected,
        base: 'Concept',
        name: 'MyConcept',
      })
    })
  })
})

describe('A member', () => {
  describe.each([
    ['abstract member', 'member', class MyConcept extends Concept { 
      member() { } },
      'member, abstract method, [conceptInfo MyConcept]' ],
    ['abstract getter', 'member', class MyConcept extends Concept { 
      get member() { } },
      'member, abstract getter, [conceptInfo MyConcept]' ],
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

describe('A concept with a member', () => {
  let myConcept
  let myConceptInfo
  let mySymbol = Symbol('mySymbol')
  beforeEach(() => {
    myConcept = class MyConcept extends Concept { 
      member() { }
      [mySymbol]() { }
    }
    myConceptInfo = Info.from(myConcept)
  })
  it('should have no own concepts', () => {
    const actual = [...myConceptInfo.ownConcepts(myConcept)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('should have no inherited concepts', () => {
    const actual = [...myConceptInfo.concepts()]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('should have own names including the member', () => {
    const actual = [...myConceptInfo.ownMembers()]
      .map(member => member.name)
      .filter(name => typeof name === 'string')
    const expected = ['member']
    expect(actual).toEqual(expected)
  })
  it('should have own symbols including the symbol member', () => {
    const actual = [...myConceptInfo.ownMembers()]
      .map(member => member.name)
      .filter(name => typeof name === 'symbol')
    const expected = [mySymbol]
    expect(actual).toEqual(expected)
  })
  describe('added as an extension to partial class', () => {
    let type
    let typeInfo
    beforeEach(() => {
      type = class MyClass extends PartialClass { }
      type[Implements] = myConcept
      typeInfo = Info.from(type)
    })
    it('should have own names excluding the member', () => {
      const actual = [...typeInfo.ownMembers()]
        .map(member => member.name)
        .filter(name => typeof name === 'string')
      const expected = [ ]
      expect(actual).toEqual(expected)
    })
    it('should have own symbols excluding the symbol member', () => {
      const actual = [...typeInfo.ownMembers()]
        .map(member => member.name)
        .filter(name => typeof name === 'symbol')
      const expected = [ ]
      expect(actual).toEqual(expected)
    })
    describe('used to extend a class', () => {
      let cls
      let clsInfo
      beforeEach(() => {
        cls = class MyClass { }
        // [Implements] is ignored when added to a partial class
        extend(cls, type)
        clsInfo = Info.from(cls)
      })
      it('should have own names excluding the member', () => {
        const ownNames = [...clsInfo.ownMembers()]
          .map(member => member.name)
          .filter(name => typeof name === 'string')
        expect(ownNames.includes('member')).toBe(false)
      })
      it('should have own symbols excluding the symbol member', () => {
        const ownSymbols = [...clsInfo.ownMembers()]
          .map(member => member.name)
          .filter(name => typeof name === 'symbol')
        expect(ownSymbols.includes(mySymbol)).toBe(false)
      })
      it('should not instance of the concept', () => {
        expect(cls.prototype).not.toBeInstanceOf(myConcept)
      })
      it('should not declare the concept as its own', () => {
        const actual = [...clsInfo.ownConcepts(cls)]
        const expected = [myConceptInfo]
        expect(actual).not.toEqual(expected)
      })
    })
  })
  describe('implemented on a class', () => {
    let cls
    let clsInfo
    beforeEach(() => {
      cls = class MyClass {
        static { implement(this, myConcept) }
      }
      clsInfo = Info.from(cls)
    })
    it('declares the concept as its own', () => {
      const actual = [...clsInfo.ownConcepts(cls)]
      const expected = [myConceptInfo]
      expect(actual).toEqual(expected)
    })
    describe('from which a class is extended', () => {
      let subCls
      let subClsInfo
      beforeEach(() => {
        subCls = class MySubClass extends cls { }
        subClsInfo = Info.from(subCls)
      })
      describe('and implemented again on the subclass', () => {
        let fn = () => { }
        beforeEach(() => {
          implement(subCls, myConcept, { member: fn })
          subClsInfo = Info.from(subCls)
        })
        it('claims to declare the concept as its own', () => {
          const actual = [...subClsInfo.ownConcepts(subCls)]
          const expected = [myConceptInfo]
          expect(actual).toEqual(expected)
        })
        it('still only has one concept', () => {
          const actual = [...subClsInfo.concepts()]
          const expected = [myConceptInfo]
          expect(actual).toEqual(expected)
        })
        it('implements member with the function passed', () => {
          const member = subClsInfo.getOwnInstanceMember('member')
          expect(member?.method).toBe(fn)
          expect(subCls.prototype.member).toBe(fn)
        })
      })
      it('has no own declared concepts', () => {
        const actual = [...subClsInfo.ownConcepts(subCls)]
        const expected = [ ]
        expect(actual).toEqual(expected)
      })
      it('inherits the concept', () => {
        const actual = [...subClsInfo.concepts()]
        const expected = [myConceptInfo]
        expect(actual).toEqual(expected)
      })
    })
  })
})

describe('A bespoke concept', () => {
  let myConcept
  beforeEach(() => {
    [myConcept] = [class MyConcept extends Concept { }]
  })
  describe('that implements MySymbol', () => {
    beforeEach(() => {
      myConcept.prototype[MySymbol] = function* () { }
    })  
    it('has a pojo', async () => {
      const pojo = {
        members: { instance: { methods: {
          [MySymbol]: { 
            host: '.',
            isAbstract: true,
          },
        } } },
        name: 'MyConcept',
        base: 'Concept'
      }
      const fnInfo = Info.from(myConcept)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
    describe('implemented on a class', () => {
      let cls
      beforeEach(() => {
        cls = class MyClass {
          static { implement(this, myConcept) }
        }
      })
      it('has a pojo', async () => {
        const pojo = {
          base: 'Object',
          members: { conceptual: { MyConcept: { methods: {
            [MySymbol]: { 
              isAbstract: true,
              host: '.',
            },
          } } } },
          name: 'MyClass'
        }
        const fnInfo = Info.from(cls)
        const actual = await fnInfo.toPojo(pojoFilter)
        expect(actual).toEqual(pojo)
      })
    })  
  })  
  describe('extended by an extended concept', () => {
    let myExtendedConcept
    beforeEach(() => {
      myExtendedConcept = class MyExtendedConcept extends myConcept { }
    })
    describe('which overrides toString on both the base and extended concept', () => {
      beforeEach(() => {
        myConcept.prototype.toString = function() { }
        myExtendedConcept.prototype.toString = function() { }
      })
      it('should throw while loading', async () => {
        expect(() => Info.from(myExtendedConcept)).toThrow([
          `Assertion failed:`,
          `Expected type to indirectly extend PartialObject.`
        ].join(' '))
      })
    })
  }) 
  describe('with static and instance members', () => {
    beforeEach(() => {
      myConcept.method = function() { }
      myConcept.prototype.method = function() { }
    })
    it('has a pojo that ignores the static member', async () => {
      const pojo = {
        name: 'MyConcept',
        base: 'Concept',
        members: { instance: { methods: {
          method: { host: '.', isAbstract: true }
        } } },
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myConcept)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
  describe('with instance data members', () => {
    beforeEach(() => {
      myConcept.prototype.myInstanceData = 2
    })
    it('will throw getting that own member', async () => {
      expect(() => Info.from(myConcept)).toThrow([
        `Assertion failed:`,
        `Concept members cannot be data properties.`,
        `Use accessor or method instead.`].join(' '))
    })
  })
  describe('with private members', () => {
    beforeEach(() => {
      [myConcept] = [class MyConcept extends Concept { 
        myPrivateMethod$() { }
        $myPrivateMethod() { }
        myPrivateMethod_() { }
        _myPrivateMethod() { }
      }]
    })
  
    it('returns private members as keys', async () => {
      const fnInfo = Info.from(myConcept)
      const names = [...fnInfo.members()]
        .map(member => member.name)
      expect(names).toEqual([
        'myPrivateMethod$',
        '$myPrivateMethod',
        'myPrivateMethod_',
        '_myPrivateMethod'
      ])
    })
  })
  describe('with a instance accessor and method members', () => {
    beforeEach(() => {
      [myConcept] = [class MyConcept extends Concept { 
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
        name: 'MyConcept',
        base: 'Concept',
        members: {
          instance: {
            properties: {
              myAccessor: { 
                isAbstract: true,
                host: '.'
              }
            },
            methods: {
              myMethod: { 
                isAbstract: true,
                host: '.'
              }
            }
          },
        },
      }
  
      const fnInfo = Info.from(myConcept)
      const actual = await fnInfo.toPojo(pojoFilter)
      expect(actual).toEqual(pojo)
    })
  })
})

