import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Reflection } from '@kingjs/reflection'
import { 
  Es6ObjectRuntimeNameOrSymbol,
  Es6ClassInfo, 
  Es6MemberInfo,
  Es6ConstructorMemberInfo, 
  Es6DataMemberInfo, 
  Es6MethodMemberInfo, 
  Es6AccessorMemberInfo } from './es6-class-info.js'
import { has } from 'lodash'
import { value } from '@kingjs/abstract'

// Functions are also instances so can self-reflect. These members would
// typically only exist in a reflection system ala FunctionInfo.call() but
// javascript is dynamic so entities that represent types are themselves instances
// of the Function type. These self-reflection-ish members should not be
// conflated with user-defined members or even system defined members available
// on instances of user-defined or system-defined types.
const Es6FunctionPrototypeMethods = [
  'apply',
  'bind',
  'call',

  'constructor',

  'arguments',
  'caller',

  'toString',
  Symbol.hasInstance,
]

// Functions are also objects so have these members too which should be filtered
// for the same reason as the function prototype methods above.
const Es6ObjectPrototypeMethods = [
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
  
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "valueOf",
]

const {
  namesAndSymbols,
} = Reflection

// All members of object and function are known members (not user defined)
describe('Es6ClassInfo ur type invariants:', () => {
  describe.each([
    Es6ClassInfo.Object,
    Es6ClassInfo.Function,
  ])('%s', (classInfo) => {
    describe.each([
      ...classInfo.ownMembers({ isStatic: true }).map(m => [m.name, m]), 
    ])('static member %s', (name, member) => {
      it('is known', () => {
        expect(member.isKnown).toBe(true)
      })
    })
    describe.each([
      ...classInfo.ownMembers({ isStatic: false }).map(m => [m.name, m]), 
    ])('member %s', (name, member) => {
      it('is known', () => {
        expect(member.isKnown).toBe(true)
      })
    })
  })
})

describe('Es6ClassInfo vacuous cases', () => {
  let classInfo
  beforeEach(() => {
    classInfo = Es6ClassInfo.from(class { })
  })
  it('does not have null own member', () => {
    expect(classInfo.getOwnMember(null)).toBe(null)
  })
  it('does not have null member', () => {
    expect(Es6ClassInfo.getMember(classInfo, null)).toBe(null)
  })
  it('does not have own member "missing"', () => {
    expect(classInfo.getOwnMember('missing')).toBe(null)
  })
  it('does not have member "missing"', () => {
    expect(Es6ClassInfo.getMember(classInfo, 'missing')).toBe(null)
  })
  it('does not equal null', () => {
    expect(classInfo.equals(null)).toBe(false)
  })
})

class MyEmptyClass { }
class MyExtendedClass extends MyEmptyClass { }

// All members share these invariants
describe('Es6ClassInfo known type invariants:', () => {
  describe.each([
    [Object, Es6ClassInfo.Object, null],
    [Function, Es6ClassInfo.Function, Es6ClassInfo.Object],
    [MyEmptyClass, Es6ClassInfo.from(MyEmptyClass), Es6ClassInfo.Object],
    // [Array, Es6ClassInfo.from(Array), Es6ClassInfo.Object],
    // [String, Es6ClassInfo.from(String), Es6ClassInfo.Object],
    // [Number, Es6ClassInfo.from(Number), Es6ClassInfo.Object],
    // [Boolean, Es6ClassInfo.from(Boolean), Es6ClassInfo.Object],
    // [Date, Es6ClassInfo.from(Date), Es6ClassInfo.Object],
  ])('%s', (fn, classInfo, base) => {
    it('has correct ctor', () => {
      expect(classInfo.ctor).toBe(fn)
    })
    it('has correct name', () => {
      expect(classInfo.name).toBe(fn.name)
    })
    it('has correct base', () => {
      if (base === null)
        expect(classInfo.base).toBeNull()
      else
        expect(classInfo.base.equals(base)).toBe(true)
    })
    it('has correct toString', () => {
      expect(classInfo.toString()).toBe(`[classInfo ${fn.name}]`)
    })
    it('equals itself', () => {
      expect(classInfo.equals(classInfo)).toBe(true)
    })
    it('can be recreated from ctor', () => {
      const recreated = Es6ClassInfo.from(fn)
      expect(recreated.equals(classInfo)).toBe(true)
    })

    // verify known members
    describe.each([
      ['length', true],
      ['name', true],
      ['prototype', true],
    ])('known member %s', (memberName, isStatic) => {
      let member
      beforeEach(() => {
        member = classInfo.getOwnMember(memberName, { isStatic })
      })
      it('is known', () => {
        expect(member.isKnown).toBe(true)
      })
    })
  
    // excludes pseudo static members
    describe('excludes static member', () => {
      describe.each(
        [...Es6ObjectPrototypeMethods,
          ...Es6FunctionPrototypeMethods,
          ...Es6ObjectRuntimeNameOrSymbol
        ])('%s', (excludedName) => {

          it('when resolved by static hierarchy', () => {
          const member = Es6ClassInfo.getMember(
            classInfo, excludedName, { isStatic: true })
          expect(member).toBeNull()
        })
      })
    })

    // excludes exposed runtime internals
    describe('excludes instance member', () => {
      describe.each(
        [...Es6ObjectRuntimeNameOrSymbol]
      )(' %s', (excludedName) => {
        it('when resolved by instance hierarchy', () => {
          const member = Es6ClassInfo.getMember(
            classInfo, excludedName)
          expect(member).toBeNull()
        })
      })    
    })

    describe.each([
      ['static', true, fn],
      ['instance', false, fn.prototype],
    ])('%s', (label, isStatic, prototype) => {

      let ownKeySet
      let ownMemberSet
      beforeEach(() => {
        ownKeySet = new Set(Reflect.ownKeys(prototype))
        ownMemberSet = new Set(classInfo.ownMembers({ isStatic }))

        // remove object runtime names and symbols
        for (const nameOrSymbol of Es6ObjectRuntimeNameOrSymbol) {
          if (fn === Object) ownKeySet.delete(nameOrSymbol)
        }
      })

      // own keys match own members less __proto__
      it('has same own member count as raw reflection own keys', () => {
        expect(ownKeySet.size).toBe(ownMemberSet.size)
      })

      let keySet
      beforeEach(() => {
        keySet = new Set(namesAndSymbols(prototype, null))

        // remove object runtime names and symbols
        for (const nameOrSymbol of Es6ObjectRuntimeNameOrSymbol)
          keySet.delete(nameOrSymbol)

        if (isStatic) {
          // remove function prototype methods for function type
          for (const name of Es6FunctionPrototypeMethods)
            keySet.delete(name)

          // remove object prototype methods for object type
          for (const name of Es6ObjectPrototypeMethods)
            keySet.delete(name)
        }
      })

      let memberSet
      let memberNameSet
      beforeEach(() => {
        let members = [...Es6ClassInfo.members(classInfo, { isStatic })]
        memberSet = new Set(members)
        memberNameSet = new Set(members.map(m => m.name))
      })

      it('has no duplicate member names', () => {
        expect(memberSet.size).toBe(memberNameSet.size)
      })

      // members match prototype chain less __proto__ and members on 
      // Object.prototype and Function.prototype
      it('has same member count as raw relection keys', () => {
        let keysLessMembers = [...keySet].filter(k => !memberSet.has(k))
        expect(keySet.size).toBe(memberSet.size)
      })

      // members is superset of own members
      it('members from hierarchy is superset of own members', () => {
        expect(memberSet.size >= ownMemberSet.size).toBe(true)
        for (const member of ownMemberSet) {
          expect(memberNameSet.has(member.name)).toBe(true)
        }
      })

      describe('member', () => {
        describe.each(
          Reflect.ownKeys(prototype).filter(
            // remove Es6ObjectRuntimeNameOrSymbol
            nameOrSymbol => !Es6ObjectRuntimeNameOrSymbol.has(nameOrSymbol)
          )
        )('%s', (name) => {
          let member
          let descriptor
          beforeEach(() => {
            member = classInfo.getOwnMember(name, { isStatic })
            descriptor = Object.getOwnPropertyDescriptor(prototype, name)
          })
          it('exists on classInfo', () => {
            expect(member).toBeDefined()
          })
          it('equals itself', () => {
            expect(member.equals(member)).toBe(true)
          })
          it('has matching descriptor info', () => {
            expect(member.isEnumerable).toBe(descriptor.enumerable)
            expect(member.isConfigurable).toBe(descriptor.configurable)
            expect(member.isWritable).toBe(descriptor.writable)

            expect(member.hasGetter).toBe(typeof descriptor.get === 'function')
            expect(member.hasSetter).toBe(typeof descriptor.set === 'function')

            expect(member.getter).toBe(descriptor.get)
            expect(member.setter).toBe(descriptor.set)

            if (member.hasValue) {
              expect(member.value).toBe(descriptor.value)
            } else {
              expect(member.value).toBeUndefined()
            }
          })
          it('has correct toString', () => {
            const toString = member.toString()
            const static$ = isStatic ? 'static ' : ''

            switch (name) {
              case 'length': 
                expect(toString).toBe(
                  `length, ${static$}const hidden { value: [number] }, ${fn.name}`)
                break
              case 'name':
                expect(toString).toBe(
                  `name, ${static$}const hidden { value: [string] }, ${fn.name}`)
                break
              case 'prototype':
                expect(toString).toBe(fn == Function ?
                  `prototype, static sealed const function, Function` :
                  `prototype, static sealed const hidden { value: [object] }, ${fn.name}`)
                break
              case 'constructor':
                expect(toString).toBe(
                  `constructor, hidden { value: [class] }, ${fn.name}`)
                break
              case Symbol.hasInstance:
                expect(toString).toBe(
                  `[Symbol(Symbol.hasInstance)], sealed const function, ${fn.name}`)
                break
              case 'arguments':
              case 'caller':
                expect(toString).toBe(
                  `${name}, { get; set }, ${fn.name}`)
                break
              default:
                expect(toString).toBe(
                  `${name}, ${static$}${typeof prototype[name]}, ${fn.name}`)
            }
          })
          it('equals another instance from getOwnMember', () => {
            const other = classInfo.getOwnMember(name, { isStatic })
            expect(member.equals(other)).toBe(true)
          })
          it('type matches predicate', () => {
            if (member instanceof Es6ConstructorMemberInfo)
              expect(member.isConstructor).toBe(true)
            else if (member instanceof Es6MethodMemberInfo)
              expect(member.isMethod).toBe(true)
            else if (member instanceof Es6DataMemberInfo)
              expect(member.isData).toBe(true)
            else if (member instanceof Es6AccessorMemberInfo)
              expect(member.isAccessor).toBe(true)
            else
              throw new Error(`Unknown member type: ${member}`)
          })
          it('is static if request static members', () => {
            expect(member.isStatic).toBe(isStatic)
          })
          it('has name in reflect own keys', () => {
            expect(ownKeySet.has(member.name)).toBe(true)
          })
          it('has host equal to classInfo', () => {
            expect(member.host.equals(classInfo)).toBe(true)
          })
          it('can be found on classInfo hierarchy by name', () => {
            const found = Es6ClassInfo.getMember(
              classInfo, name, { isStatic })
            expect(found.equals(member)).toBe(true)
          })
        })
      })
    })
  })
})

describe('Es6ClassInfo Object class', () => {
  let classInfo
  beforeEach(() => {
    classInfo = Es6ClassInfo.Object
  })
  it('is not non-public', () => {
    expect(classInfo.isNonPublic).toBe(false)
  })
  it('has descriptive toString', () => {
    expect(classInfo.toString()).toEqual('[classInfo Object]')
  })
  it('has descriptive inspect to string', () => {
    expect(classInfo[Symbol.for('nodejs.util.inspect.custom')]())
      .toEqual('[classInfo Object]')
  })

  describe('static members', () => {
    let staticMembers
    beforeEach(() => {
      staticMembers = [...classInfo.ownMembers({ isStatic: true })]
    })
    it('have no parent', () => {
      for (const member of staticMembers)
        expect(member.parent()).toBe(null)
    })
    it('have no root', () => {
      for (const member of staticMembers)
        expect(member.root()).toBe(null)
    })
    it('have no root host', () => {
      for (const member of staticMembers)
        expect(member.rootHost()).toBe(null)
    })
  })
  describe('members', () => {
    let members
    beforeEach(() => {
      members = [...classInfo.ownMembers()]
    })
    it('none have a parent', () => {
      for (const member of members)
        expect(member.parent()).toBe(null)
    })
    it('none have a root', () => {
      for (const member of members)
        expect(member.root()).toBe(null)
    })
    it('none have a root host', () => {
      for (const member of members)
        expect(member.rootHost()).toBe(null)
    })
  })
})
describe('Es6ClassInfo Function class', () => {
  let classInfo
  beforeEach(() => {
    classInfo = Es6ClassInfo.Function
  })
  it('does not equal Object', () => {
    expect(classInfo.equals(Es6ClassInfo.Object)).toBe(false)
  })
  describe('members', () => {
    let members
    beforeEach(() => {
      members = [...classInfo.ownMembers()]
    })
    it('is subset of members from hierarchy plus object', () => {
      const fromMembers = [...Es6ClassInfo.members(classInfo)]
      const membersPlusObject = [...members, ...Es6ClassInfo.Object.ownMembers()]
      expect(membersPlusObject.length > fromMembers.length).toBe(true)
      for (const member of fromMembers) {
        const found = membersPlusObject.find(m => m.equals(member))
        expect(found).toBeDefined()
      }
    })
  })
  describe('static members', () => {
    let ownMembers
    beforeEach(() => {
      ownMembers = [...classInfo.ownMembers({ isStatic: true })]
    })
    it('is length, name, or prototype', () => {
      expect(ownMembers.length).toBe(3)
      for (const ownMember of ownMembers) {
        expect(['length', 'name', 'prototype'
          ].includes(ownMember.name)).toBe(true)
      }
    })
    it('matches members from hierarchy', () => {
      // Object static members are not inhertied by Function so
      // the static members of Function are exactly those defined
      // on Function itself.
      const members = [
        ...Es6ClassInfo.members(classInfo, { isStatic: true })]

      expect(members.length).toBe(ownMembers.length)
      for (const ownMember of ownMembers) {
        const found = members.find(m => m.equals(ownMember))
        expect(found).toBeDefined()
      }
    })
    it('are public', () => {
      for (const member of ownMembers)
        expect(member.isNonPublic).toBe(false)
    })
  })
})
describe('Es6ClassInfo empty custom class', () => {
  let classInfo
  beforeEach(() => {
    classInfo = Es6ClassInfo.from(MyEmptyClass)
  })
  it('has correct name', () => {
    expect(classInfo.name).toBe('MyEmptyClass')
  })
  it('has object parent', () => {
    expect(classInfo.base.equals(Es6ClassInfo.Object)).toBe(true)
  })
  describe('members', () => {
    let members
    beforeEach(() => {
      members = [...classInfo.ownMembers()]
    })
    it('has only constructor member', () => {
      expect(members.length).toBe(1)
      expect(members[0]).toBeInstanceOf(Es6ConstructorMemberInfo)
      expect(members[0].isConstructor).toBe(true)
      expect(members[0].isStatic).toBe(false)
      expect(members[0].isNonPublic).toBe(false)
      expect(members[0].isKnown).toBe(true)
    })
  })
  describe('static members', () => {
    let staticMembers
    beforeEach(() => {
      staticMembers = [...classInfo.ownMembers({ isStatic: true })]
    })
    it('is length, name, or prototype', () => {
      expect(staticMembers.length).toBe(3)
      for (const member of staticMembers) {
        expect(['length', 'name', 'prototype'].includes(member.name)).toBe(true)
      }
    })
    it('are all hosted by MyEmptyClass', () => {
      for (const member of staticMembers)
        expect(member.host.equals(classInfo)).toBe(true)
    })
    it('have a parent found on object', () => {
      for (const member of staticMembers) {
        const parent = member.parent()
        expect(parent).toBeDefined()
        // Es6 is really: MyEmptyClass → Function.prototype → Object.prototype
        // We pretend it is: MyEmptyClass → Object 
        const memberOnFunction = Es6ClassInfo.Object.getOwnMember(
          member.name, { isStatic: true })
        expect(parent.equals(memberOnFunction)).toBe(true)
      }
    })
    it('have Object as a parent host', () => {
      // Es6 is really: MyEmptyClass → Function.prototype → Object.prototype
      // We pretend it is: MyEmptyClass → Object 
      for (const member of staticMembers)
        expect(member.rootHost().equals(Es6ClassInfo.Object)).toBe(true)
    })
  })
})
describe('Es6ClassInfo extended custom class', () => {
  let classInfo
  let baseClassInfo
  beforeEach(() => {
    classInfo = Es6ClassInfo.from(MyExtendedClass)
    baseClassInfo = Es6ClassInfo.from(MyEmptyClass)
  })
  it('has correct base class', () => {
    expect(classInfo.base.equals(baseClassInfo)).toBe(true)
  })
})
describe('Es6ClassInfo class with non-public member', () => {
  let classInfo
  class MyClassWithNonPublic {
    _nonPublicMethod() { }
    nonPublicMethod_() { }
    $nonPublicMethod() { }
    nonPublicMethod$() { }
  }
  beforeEach(() => {
    classInfo = Es6ClassInfo.from(MyClassWithNonPublic)
  })
  describe.each([
    '_nonPublicMethod',
    'nonPublicMethod_',
    '$nonPublicMethod',
    'nonPublicMethod$',
  ])('%s', (memberName) => {
    let member
    beforeEach(() => {
      member = classInfo.getOwnMember(memberName)
    })
    it('is non-public', () => {
      expect(member.isNonPublic).toBe(true)
    })
  })
})
describe('Es6MemberInfo toString', () => {
  let myClass
  let classInfo
  let member
  let staticMember
  let objectMember
  let ctorMember
  beforeEach(() => {
    myClass = class MyEmptyClass { 
      static toString() {}
      toString() { } 
    }
    classInfo = Es6ClassInfo.from(myClass)
    member = classInfo.getOwnMember('toString')
    staticMember = classInfo.getOwnMember('toString', { isStatic: true })
    objectMember = Es6ClassInfo.Object.getOwnMember('toString')
    ctorMember = classInfo.getOwnMember('constructor')
  })
  describe('of sub class member', () => {
    let mySubClass
    let subMember
    beforeEach(() => {
      mySubClass = class MySubClass extends myClass { 
        toString() { }
      }
      const subClassInfo = Es6ClassInfo.from(mySubClass)
      subMember = subClassInfo.getOwnMember('toString')
    })

    it('has correct root host', () => {
      expect(subMember.root().equals(objectMember)).toBe(true)
    })
  })

  it('has correct toString', () => {
    expect(member.toString())
      .toBe('toString, function, MyEmptyClass')
  })
  // test member info .equals

  it('equals itself', () => {
    expect(member.equals(member)).toBe(true) 
  })
  it('does not equal null', () => {
    expect(member.equals(null)).toBe(false) 
  })
  it('does not equal object toString', () => {
    expect(member.equals(objectMember)).toBe(false) 
  })
  it('does not equal static toString', () => {
    expect(member.equals(staticMember)).toBe(false)
  })
  it('does not equal constructor', () => {
    expect(member.equals(ctorMember)).toBe(false)
  })
  it('does not equal accessor "toString" dynamically set on same class', () => {
    myClass.prototype.__defineGetter__('toString', function() { return '$' })
    const accessorMember = classInfo.getOwnMember('toString')
    expect(member.equals(accessorMember)).toBe(false)
  })
})
// describe('Es6ClassInfo custom class with one member', () => {
//   let classInfo
//   class MyEmptyClass {
//     myMethod() {}
//     static myStaticMethod() {}
//   }
//   beforeEach(() => {
//     classInfo = Es6ClassInfo.from(MyEmptyClass)
//   })
// })