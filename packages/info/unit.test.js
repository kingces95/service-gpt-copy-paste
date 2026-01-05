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
import { abstract, isAbstract } from '@kingjs/abstract'

expect.extend({ toEqualAsSet })

const MySymbol = Symbol('test-symbol')

const PartialObjectMd = {
  ctor: PartialObject,
  toString: '[classInfo PartialObject]',
  isKnown: true,
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: null,
}

const PartialPojoMd = {
  ctor: PartialPojo,
  toString: '[classInfo PartialPojo]',
  isKnown: true,
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialObject,
}

const PartialClassMd = {
  ctor: PartialClass,
  toString: '[classInfo PartialClass]',
  isKnown: true,
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialObject,
}

const ConceptMd = {
  ctor: Concept,
  toString: '[classInfo Concept]',
  isKnown: true,
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialObject,
}

const MyPartialPojoMd = {
  ctor: PartialReflect.defineType({ }),
  toString: '[partialPojoInfo]',
  isKnown: false,
  isTransparent: true,
  isAbstract: true,
  isPartialPojoSubClass: true,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: true,
  base: PartialPojo,
}

const MyPartialClassMd = {
  ctor: class MyPartialClass extends PartialClass { },
  toString: '[partialClassInfo MyPartialClass]',
  isKnown: false,
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: true,
  isConceptSubclass: false,
  isAnonymous: false,
  base: PartialClass,
}

const MyConceptMd = {
  ctor: class MyConcept extends Concept { },
  toString: '[conceptInfo MyConcept]',
  isKnown: false,
  isTransparent: false,
  isAbstract: true,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: true,
  isAnonymous: false,
  base: Concept,
}

const Es6Object = {
  ctor: Object,
  toString: '[classInfo Object]',
  isKnown: true,
  isTransparent: false,
  isAbstract: false,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  ownInstanceMembers: [
    ...Reflect.ownKeys(Object.prototype)]
    .filter(str => str != '__proto__'),
  ownStaticMembers: [
    ...Reflect.ownKeys(Object)],
  instanceMembers: [
    ...Reflect.ownKeys(Object.prototype)]
    .filter(str => str != '__proto__'),
  staticMembers: [
    ...Reflect.ownKeys(Object)],
  base: null,
}

const Es6Function = {
  ctor: Function,
  toString: '[classInfo Function]',
  isKnown: true,
  isTransparent: false,
  isAbstract: false,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  ownInstanceMembers: [
    ...Reflect.ownKeys(Function.prototype)],
  ownStaticMembers: [
    ...Reflect.ownKeys(Function)],
  instanceMembers: [
    ...Reflect.ownKeys(Function.prototype),
    ...Reflect.ownKeys(Object.prototype)]
    .filter(str => str != '__proto__'),
  staticMembers: [
    ...Reflect.ownKeys(Function)],
  base: Object,
}

class MyClass { }
const MyClassMd = {
  ctor: MyClass,
  toString: '[classInfo MyClass]',
  isKnown: false,
  isTransparent: false,
  isAbstract: false,
  isPartialPojoSubClass: false,
  isPartialClassSubclass: false,
  isConceptSubclass: false,
  isAnonymous: false,
  ownInstanceMembers: [
    ...Reflect.ownKeys(MyClass.prototype)],
  ownStaticMembers: [
    ...Reflect.ownKeys(MyClass)],
  instanceMembers: [
    ...Reflect.ownKeys(MyClass.prototype),
    ...Reflect.ownKeys(Object.prototype)]
    .filter(str => str != '__proto__'),
  staticMembers: [
    ...Reflect.ownKeys(MyClass)],
  base: Object,
}

describe('Given', () => {
  describe.each([
      ['Es6Object', Es6Object],
      ['Es6Function', Es6Function],
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
      info = Info.from(md.ctor)
    })
    it('should have matching name', () => {
      const expectedName = md.ctor.name
      expect(info.name).toBe(expectedName || null)
    })
    it('should be public', () => {
      expect(info.isNonPublic).toBe(false)
    })
    it('should have matching ctor', () => {
      const expectedCtor = md.ctor
      expect(info.ctor).toBe(expectedCtor)
    })
    it('should have expected toString', () => {
      expect(info.toString()).toBe(md.toString)
    })
    it('should have matching base', () => {
      const expectedBase = Info.from(md.base)
      const actualBase = info.base
      expect(expectedBase == actualBase).toBe(true)
    })
    it('should be subclass of its base and not vice-versa', () => {
      const expectedBase = md.base
      if (!expectedBase) return
      const baseInfo = Info.from(expectedBase)
      expect(info.isSubclassOf(baseInfo)).toBe(true)
      expect(baseInfo.isSubclassOf(info)).toBe(false)
    })
    it('should equal itself', () => {
      expect(info.equals(info)).toBe(true)
    })
    it('should not equal null', () => {
      expect(info.equals(null)).toBe(false)
    })
    it('should have have expected predicates', () => {
      expect(info.isKnown).toBe(md.isKnown)
      expect(info.isPartialPojoSubClass).toBe(md.isPartialPojoSubClass)
      expect(info.isAbstract).toBe(md.isAbstract)
      expect(info.isTransparentPartialObject).toBe(md.isTransparent)
      expect(info.isPartialClassSubclass).toBe(md.isPartialClassSubclass)
      expect(info.isConceptSubclass).toBe(md.isConceptSubclass)
      expect(info.isAnonymous).toBe(md.isAnonymous)
    })
    it('should have matching own instance members', () => {
      const expected = md.ownInstanceMembers ?? []
      const members = [...info.ownInstanceMembers()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
    })
    it('should have matching own static members', () => {
      const expected = md.ownStaticMembers ?? []
      const members = [...info.ownStaticMembers()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
    })
    it('should have matching instance members', () => {
      const expected = md.instanceMembers ?? []
      const members = [...info.instanceMembers()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
    })
    it('should have matching static members', () => {
      const expected = md.staticMembers ?? []
      const members = [...info.staticMembers()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
  
      for (const member of members)
        expect(info.getStaticMember(member)).not.toBeNull()
    })
    it('should have expected members', () => {
      const expected = [
        ...md.instanceMembers ?? [],
        ...md.staticMembers ?? []]
      const members = [...info.members()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
    })
    it('should have own members as union of own static and own instance', () => {
      const expected = [
        ...md.ownInstanceMembers ?? [],
        ...md.ownStaticMembers ?? []]
      const members = [...info.ownMembers()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
    })
    it('should have members as union of static and instance', () => {
      const expected = [
        ...md.instanceMembers ?? [],
        ...md.staticMembers ?? []]
      const members = [...info.members()].map(m => m.name)
      expect(members).toEqualAsSet(expected)
    })
    it('should have no members if abstract and known', () => {
      if (!info.isAbstract) return
      if (!info.isKnown) return
      const members = [...info.members()]
      expect(members).toEqual([])
    })
    it('should have no constructor or name member if abstract', () => {
      if (!info.isAbstract) return
      const ctorMember = info.getOwnInstanceMember('constructor')
      expect(ctorMember).toBeNull()
      const nameMember = info.getOwnStaticMember('name')
      expect(nameMember).toBeNull()
    })
    it('should have no own constructor or name member if abstract', () => {
      if (!info.isAbstract) return
      const ctorMember = info.getInstanceMember('constructor')
      expect(ctorMember).toBeNull()
      const nameMember = info.getStaticMember('name')
      expect(nameMember).toBeNull()
    })
    it('should have no myMissingMember member', () => {
      const missingMember = info.getOwnInstanceMember('myMissingMember')
      expect(missingMember).toBeNull()
    })
    it('should have no own PartialClass associations', () => {
      const partialClassAssociations = [
        ...info.ownPartialClasses()]
      expect(partialClassAssociations).toEqual([])
    })
    it('should have no PartialClass associations', () => {
      const partialClassAssociations = [
        ...info.partialClasses()]
      expect(partialClassAssociations).toEqual([])
    })
    it('should have no own Concept associations', () => {
      const conceptAssociations = [
        ...info.ownConcepts()]
      expect(conceptAssociations).toEqual([])
    })
    it('should have no Concept associations', () => {
      const conceptAssociations = [
        ...info.concepts()]
      expect(conceptAssociations).toEqual([])
    })
    it('should have no expected associated Concepts', () => {
      const associatedConcepts = [
        ...info.associatedConcepts()]
      expect(associatedConcepts).toEqual([])
    })
    it('should have no expected own associated Concepts', () => {
      const ownAssociatedConcepts = [
        ...info.ownAssociatedConcepts()]
      expect(ownAssociatedConcepts).toEqual([])
    })
    describe('static members', () => {
      let staticMembers
      beforeEach(() => {
        staticMembers = [...info.staticMembers()]
      })
      it('should all be known if type is known', () => {
        if (!info.isKnown) return
        for (const member of staticMembers)
          expect(member.isKnown).toBe(true)
      })
    })
    describe('instance members', () => {
      let instanceMembers
      beforeEach(() => {
        instanceMembers = [...info.instanceMembers()]
      })
      it('should all be known if type is known', () => {
        if (!info.isKnown) return
        for (const member of instanceMembers)
          expect(member.isKnown).toBe(true)
      })
    })
  })
})

const ObjectToStringMd = {
  name: 'toString',
  cls: Object,
  toString: 'toString, known method, [classInfo Object]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
  isKnown: true,
}

const ObjectConstrutorMd = {
  name: 'constructor',
  cls: Object,
  toString: 'constructor, known hidden constructor, [classInfo Object]',
  type: 'constructor',
  isConstructor: true,
  isMethod: true,
  isKnown: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyConceptMemberMd = {
  name: 'member',
  cls: class MyConcept extends Concept { member() { } },
  toString: 'member, abstract method, [conceptInfo MyConcept]',
  type: 'method',
  isMethod: true,
  isAbstract: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
  // odd but consistent, member was not added via Concept mechanism
  isConceptual: false, 
}

const MyConceptExtensionMemberMd = {
  name: 'member',
  cls: class MyConceptExtension extends Concept { 
    static [Implements] = MyConceptMemberMd.cls
  },
  concepts: [ MyConceptMemberMd.cls ],
  toString: 'member, abstract method, [conceptInfo MyConceptExtension]',
  type: 'method',
  isMethod: true,
  isAbstract: true,
  isConceptual: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyPartialClassMemberMd = {
  name: 'member',
  cls: class MyPartialClass extends PartialClass { member() { } },
  toString: 'member, method, [partialClassInfo MyPartialClass]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyPartialClassExtensionMemberMd = {
  name: 'member',
  cls: class MyPartialClassExtension extends PartialClass {
    static [Extends] = MyPartialClassMemberMd.cls
  },
  partialClass: MyPartialClassMemberMd.cls,
  toString: 'member, method, [partialClassInfo MyPartialClassExtension]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyPojoMemberMd = {
  name: 'member',
  cls: PartialReflect.defineType({ member() { } }),
  type: 'method',
  isMethod: true,
  toString: 'member, method, [partialPojoInfo]',
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyClassMemberMd = {
  name: 'member',
  cls: class MyClass { member() { } },
  type: 'method',
  isMethod: true,
  toString: 'member, method, [classInfo MyClass]',
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyClassConstructorMd = {
  name: 'constructor',
  cls: class MyClass { constructor() { } },
  toString: 'constructor, known hidden constructor, [classInfo MyClass]',
  type: 'constructor',
  isConstructor: true,
  isMethod: true,
  isKnown: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
  parentHost: Object,
  rootHost: Object,
}

const MyAnonMemberMd = {
  name: 'member',
  cls: [class { member() { } }][0],
  toString: 'member, method, [classInfo <anonymous>]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyStaticMemberMd = {
  name: 'member',
  cls: class MyClass { static member() { } },
  toString: 'member, static method, [classInfo MyClass]',
  type: 'method',
  isStatic: true,
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MySymbolMemberMd = {
  name: MySymbol,
  cls: class MyClass { [MySymbol]() { } },
  toString: '[Symbol(test-symbol)], method, [classInfo MyClass]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyStaticSymbolMemberMd = {
  name: MySymbol,
  cls: class MyClass { static [MySymbol]() { } },
  toString: '[Symbol(test-symbol)], static method, [classInfo MyClass]',
  type: 'method',
  isStatic: true,
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyFieldMd = {
  name: 'member',
  cls: class MyClass { static { this.prototype.member = 42 } },
  toString: 'member, number, [classInfo MyClass]',
  type: 'field',
  isField: true,
  isData: true,
  isConfigurable: true,
  isEnumerable: true,
  isWritable: true,
  hasValue: true,
}

const MyGetterMd = {
  name: 'member',
  cls: class MyClass { get member() { } },
  toString: 'member, getter, [classInfo MyClass]',
  type: 'getter',
  isAccessor: true,
  hasGetter: true,
  isConfigurable: true,
}

const MySetterMd = {
  name: 'member',
  cls: class MyClass { set member(value) { } },
  toString: 'member, setter, [classInfo MyClass]',
  type: 'setter',
  isAccessor: true,
  hasSetter: true,
  isConfigurable: true,
}

const MyAccessorMd = {
  name: 'member',
  cls: class MyClass { get member() { } set member(value) { } },
  toString: 'member, property, [classInfo MyClass]',
  type: 'property',
  isAccessor: true,
  hasGetter: true,
  hasSetter: true,
  isConfigurable: true,
}

describe('Member', () => {
  describe.each([
    ['ObjectToString', ObjectToStringMd],
    ['ObjectConstrutor', ObjectConstrutorMd],
    ['MyConceptMember', MyConceptMemberMd],
    ['MyConceptExtensionMember', MyConceptExtensionMemberMd],
    ['MyPartialClassMember', MyPartialClassMemberMd],
    ['MyPartialClassExtensionMember', MyPartialClassExtensionMemberMd],
    ['MyPojoMember', MyPojoMemberMd],
    ['MyClassMember', MyClassMemberMd],
    ['MyClassConstructor', MyClassConstructorMd],
    ['MyAnonMember', MyAnonMemberMd],
    ['MyStaticMember', MyStaticMemberMd],
    ['MySymbolMember', MySymbolMemberMd],
    ['MyStaticSymbolMember', MyStaticSymbolMemberMd],
    ['MyField', MyFieldMd],
    ['MyGetter', MyGetterMd],
    ['MySetter', MySetterMd],
    ['MyAccessor', MyAccessorMd],
  ])('%s', (_, md) => {
    let typeInfo
    let info
    beforeEach(() => {
      typeInfo = Info.from(md.cls)
      info = typeInfo.getInstanceMember(md.name)
      if (!info)
        info = typeInfo.getStaticMember(md.name)
    })
    it('should equal itself', () => {
      expect(info.equals(info)).toBe(true)
    })
    it('should equal a different instance of itself', () => {
      const typeInfo = Info.from(md.cls)
      let otherInfo = typeInfo.getInstanceMember(md.name)
      if (!otherInfo)
        otherInfo = typeInfo.getStaticMember(md.name)
      expect(info.equals(otherInfo)).toBe(true)
    })
    it('should not equal null', () => {
      expect(info.equals(null)).toBe(false)
    })
    it('should have expected toString', () => {
      expect(info.toString()).toBe(md.toString)
    })
    it('should have expected implemented concept', () => {
      const actual = [...info.concepts()]
      const expected = [...md.concepts || []]
        .map(concept => Info.from(concept))
      expect(actual).toEqualAsSet(expected)
    })
    it('should have expected merged PartialClass', () => {
      const actual = info.partialClass
      const expected = Info.from(md.partialClass)
      expect(actual).toBe(expected)
    })
    it('has expected predicates', () => {
      expect(info.isKnown).toBe(!!md.isKnown)
      expect(info.isNonPublic).toBe(!!md.isNonPublic)
      expect(info.isAbstract).toBe(!!md.isAbstract)
      expect(info.isConceptual).toBe(!!md.isConceptual)

      expect(info.isAccessor).toBe(!!md.isAccessor)
      expect(info.isMethod).toBe(!!md.isMethod)
      // expect(info.isData).toBe(!!md.isData)
      expect(info.isConstructor).toBe(!!md.isConstructor)
      expect(info.type).toBe(md.type)
      
      expect(info.isStatic).toBe(!!md.isStatic)

      expect(info.isEnumerable).toBe(!!md.isEnumerable)
      expect(info.isConfigurable).toBe(!!md.isConfigurable)
      expect(info.isWritable).toBe(!!md.isWritable)

      expect(info.hasGetter).toBe(!!md.hasGetter)
      expect(info.hasSetter).toBe(!!md.hasSetter)
      expect(info.hasValue).toBe(!!md.hasValue)
    })
    it('has expected descriptor getter, setter, value', () => {
      if (md.hasGetter) expect(info.getter).toBeInstanceOf(Function)
      else expect(info.getter).toBeUndefined()

      if (md.hasSetter) expect(info.setter).toBeInstanceOf(Function)
      else expect(info.setter).toBeUndefined()

      // if (md.hasValue) expect(info.value).toBeInstanceOf(Function)
      // else expect(info.value).toBeUndefined()
    })
    it('has no root, rootHost, or parent', () => {
      if (!md.parentHost) {
        expect(info.root()).toBeNull()
        expect(info.rootHost()).toBeNull()
        expect(info.parent()).toBeNull()
        return
      }

      const expectedParentHost = Info.from(md.parentHost)
      const expectedParent = expectedParentHost.getInstanceMember(md.name)

      const expectedRootHost = Info.from(md.rootHost)
      const expectedRoot = expectedRootHost.getInstanceMember(md.name)

      const root = info.root()
      expect(root.equals(expectedRoot)).toBe(true)

      const rootHost = info.rootHost()
      expect(rootHost).toBe(expectedRootHost)

      const parent = info.parent()
      expect(parent.equals(expectedParent)).toBe(true)
    })
  })
})
