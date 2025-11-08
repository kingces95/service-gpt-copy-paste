import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { FunctionInfo, Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"
import { Extension, Extensions } from '@kingjs/extension'
import { extend } from '@kingjs/extend'
import { Concept, Concepts, implement } from '@kingjs/concept'

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
    expect(!fnInfo.isPartial).toBe(true)
  })
  it('is a concept', () => {
    expect(fnInfo.isConcept).toBe(true)
  })
  it('has no declared or inherited concepts', () => {
    const concepts = FunctionInfo.concepts(fnInfo)
    expect(Array.from(concepts)).toEqual([])
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
  it('has PartialClassInfo base', () => {
    const ExtensionInfo = Info.PartialClass
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

function filter(pojo, { isNonPublic } = { }) {
  return filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
      isNonPublic,
    },
    includeStatic: {
      isInherited: true,
      // isSymbol: true,
    }
  })
}

describe('A concept', () => {
  describe('with a name', () => {
    let cls
    beforeEach(() => {
      cls = class MyClass extends Concept { }
    })
    it('has a toString of MyClass', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('MyClass, Concept')
    })
  })
  describe('without a name', () => {
    let cls
    beforeEach(() => {
      [cls] = [class extends Extension { }]
    })
    it('has a toString of <anonymous>', () => {
      const fnInfo = Info.from(cls)
      expect(fnInfo.toString()).toBe('<anonymous>, Extension')
    })
  })

  describe.each([
    ['no members', class MyConcept extends Concept { }, { }],
    ['static data', class MyConcept extends Concept { 
      static myStaticMember = 1 }, {
      // static members are ignored by the DSL
      }],
    ['static getter', class MyConcept extends Concept {
      static get myStaticAccessor() { return 1 } 
    }, { 
      // static members are ignored by the DSL
    }],
    ['instance setter', class MyConcept extends Concept {
      set myInstanceAccessor(value) { }
    }, 
    {
      members: { instance: { accessors: {
        myInstanceAccessor: { 
          type: 'accessor', 
          host: 'MyConcept',
          hasSetter: true,
          isAbstract: true
        }
      } } },
    }],
  ])('with %s', (_, cls, expected) => {
    it('has a pojo', async () => {
      const fnInfo = Info.from(cls)
      expect(filter(await fnInfo.__toPojo())).toEqual({
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
      'member { value: abstract }, MyConcept' ],
    ['abstract getter', 'member', class MyConcept extends Concept { 
      get member() { } },
      'member { get: abstract }, MyConcept' ],
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
  it('should have own names including the member', () => {
    const actual = [...myConceptInfo.ownNames()]
    const expected = ['member']
    expect(actual).toEqual(expected)
  })
  it('should have own symbols including the symbol member', () => {
    const actual = [...myConceptInfo.ownSymbols()]
    const expected = [mySymbol]
    expect(actual).toEqual(expected)
  })
  describe('added as an extension to partial class', () => {
    let type
    let typeInfo
    beforeEach(() => {
      type = class MyClass extends Extension { }
      type[Concepts] = myConcept
      typeInfo = Info.from(type)
    })
    it('should have own names excluding the member', () => {
      const actual = [...typeInfo.ownNames()]
      const expected = [ ]
      expect(actual).toEqual(expected)
    })
    it('should have own symbols excluding the symbol member', () => {
      const actual = [...typeInfo.ownSymbols()]
      const expected = [ ]
      expect(actual).toEqual(expected)
    })
    describe('used to extend a class', () => {
      let cls
      let clsInfo
      beforeEach(() => {
        cls = class MyClass { }
        // [Concepts] is ignored when added to a partial class
        extend(cls, type)
        clsInfo = Info.from(cls)
      })
      it('should have own names excluding the member', () => {
        const ownNames = [...clsInfo.ownNames()]
        expect(ownNames.includes('member')).toBe(false)
      })
      it('should have own symbols excluding the symbol member', () => {
        const ownSymbols = [...clsInfo.ownSymbols()]
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
          const actual = [...FunctionInfo.concepts(subClsInfo)]
          const expected = [myConceptInfo]
          expect(actual).toEqual(expected)
        })
        it('implements member with the function passed', () => {
          const member = subClsInfo.getOwnMember('member')
          expect(member?.value).toBe(fn)
          expect(subCls.prototype.member).toBe(fn)
        })
      })
      it('has no own declared concepts', () => {
        const actual = [...subClsInfo.ownConcepts(subCls)]
        const expected = [ ]
        expect(actual).toEqual(expected)
      })
      it('inherits the concept', () => {
        const actual = [...FunctionInfo.concepts(subClsInfo)]
        const expected = [myConceptInfo]
        expect(actual).toEqual(expected)
      })
    })
  })
})

describe('A bespoke concept', () => {
  let myClass
  beforeEach(() => {
    [myClass] = [class MyConcept extends Concept { }]
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
            host: 'MyConcept',
            isAbstract: true,
          },
        } } },
        name: 'MyConcept',
        base: 'Concept'
      }
      const fnInfo = Info.from(myClass)
      const actual = await fnInfo.__toPojo()
      const actualPojo = filter(actual)
      expect(actualPojo).toEqual(pojo)
    })
    describe('implemented on a class', () => {
      let cls
      beforeEach(() => {
        cls = class MyClass {
          static { implement(this, myClass) }
        }
      })
      it('has a pojo', async () => {
        const pojo = {
          base: 'Object',
          members: { instance: { conceptual: { MyConcept: { methods: {
            [MySymbol]: { 
              type: 'method',
              isAbstract: true,
              host: 'MyClass',
            },
          } } } } },
          name: 'MyClass'
        }
        const fnInfo = Info.from(cls)
        expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
      })
    })  
  })  
  describe('extended by an extended concept', () => {
    let myExtendedConcept
    beforeEach(() => {
      myExtendedConcept = class MyExtendedConcept extends myClass { }
    })
    describe('which overrides toString on both the base and extended concept', () => {
      beforeEach(() => {
        myClass.prototype.toString = function() { }
        myExtendedConcept.prototype.toString = function() { }
      })
      it('should throw while loading', async () => {
        expect(() => Info.from(myExtendedConcept)).toThrow([
          `Assertion failed:`,
          `Concept MyExtendedConcept must directly extend Concept.`
        ].join(' '))
      })
    })
  }) 
  describe('with static and instance members', () => {
    beforeEach(() => {
      myClass.method = function() { }
      myClass.prototype.method = function() { }
    })
    it('has a pojo that ignores the static member', async () => {
      const pojo = {
        name: 'MyConcept',
        base: 'Concept',
        members: { instance: { methods: {
          method: { host: 'MyConcept', type: 'method', isAbstract: true }
        } } },
      }

      // Constructors are ignored by the DSL
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
  describe('with instance data members', () => {
    beforeEach(() => {
      myClass.prototype.myInstanceData = 2
    })
    it('will throw getting that own member', async () => {
      const info = Info.from(myClass)
      expect(() => info.getOwnMember('myInstanceData')).toThrow([
        `Assertion failed:`,
        `Concept members cannot be data properties.`,
        `Use accessor or method instead.`].join(' '))
    })
  })
  describe('with private members', () => {
    beforeEach(() => {
      [myClass] = [class extends Concept { 
        myPrivateMethod$() { }
        $myPrivateMethod() { }
        myPrivateMethod_() { }
        _myPrivateMethod() { }
      }]
    })
  
    it('returns private members as keys', async () => {
      const fnInfo = Info.from(myClass)
      const names = [...FunctionInfo.keys(fnInfo)]
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
      [myClass] = [class extends Concept { 
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
              myAccessor: { 
                type: 'accessor', 
                hasGetter: true, 
                hasSetter: true, 
                isAbstract: true,
              }
            },
            methods: {
              myMethod: { type: 'method', isAbstract: true}
            }
          },
        },
        base: 'Concept',
      }
  
      const fnInfo = Info.from(myClass)
      expect(filter(await fnInfo.__toPojo())).toEqual(pojo)
    })
  })
})

