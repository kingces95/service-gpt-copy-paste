import assert from 'assert'
import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  Es6ObjectRuntimeNameOrSymbol,
  Es6ClassInfo, 
  Es6MemberInfo,
  Es6ConstructorInfo, 
  Es6MethodInfo, 
  Es6FieldInfo,
  Es6GetterInfo,
  Es6SetterInfo,
  Es6PropertyInfo
} from './es6-class-info.js'

const Obj = {
  name: 'Object',
  class: Object,
  isKnown: true,
  base: null
}

const Func = {
  name: 'Function',
  class: Function,
  isKnown: true,
}

const NonPublic = {
  name: 'NonPublicClass',
  class: class _NonPublicClass_ {},
  isNonPublic: true,
}

const Anonymous = {
  name: 'AnonymousClass',
  class: [class {}][0],
  isAnonymous: true,
}

const MyBase = class MyBase { }
const MyClass = {
  name: 'MyClass',
  class: class MyClass extends MyBase { },
  base: MyBase,
}

class MyClassWithMembers {
  static staticField = 1
}
MyClassWithMembers.prototype.instanceField = 2
const MyClassWithOwnMembers = {
  name: 'MyClassWithOwnMembers',
  class: MyClassWithMembers,
  hasMembers: true,
  hasOwnMembers: true,
}

const MyClassWithInheritedMembers = {
  name: 'MyClassWithInheritedMembers',
  class: class MyClassWithInheritedMembers extends MyClassWithMembers { },
  base: MyClassWithMembers,
  hasMembers: true,
}

const Types = [
  [ Obj.name, Obj ],
  [ Func.name, Func ],
  [ NonPublic.name, NonPublic ],
  [ Anonymous.name, Anonymous ],
  [ MyClass.name, MyClass ],
  [ MyClassWithOwnMembers.name, MyClassWithOwnMembers ],
  [ MyClassWithInheritedMembers.name, MyClassWithInheritedMembers ],
]

describe('Es6ClassInfo', () => {
  it('from returns null for null function', () => {
    expect(Es6ClassInfo.from(null)).toBe(null)
  })
  describe.each(Types)('%s', (_, md) => {
    let info
    beforeEach(() => {
      info = Es6ClassInfo.from(md.class)
    })

    it('is unique per class', () => {
      const other = Es6ClassInfo.from(md.class)
      expect(info).toBe(other)
      expect(info.equals(other)).toBe(true)
    })
    it('has correct name', () => {
      expect(info.name).toBe(md.class.name || null)
    })
    it('has the correct ctor function', () => {
      expect(info.ctor).toBe(md.class)
    })
    it('has correct predicates', () => {
      expect(info.isKnown).toBe(md.isKnown == true)
      expect(info.isNonPublic).toBe(md.isNonPublic == true)
      expect(info.isAnonymous).toBe(md.isAnonymous == true)
    })
    it('has correct base class', () => {
      const baseFn = 'base' in md ? md.base : Object
      const expectedBase = Es6ClassInfo.from(baseFn)
      const actualBase = info.base
      expect(actualBase == expectedBase).toBe(true)
    })
    it('returns __proto__', () => {
      const protoMember = info.getMember('__proto__')
      expect(protoMember).toBeInstanceOf(Es6PropertyInfo)
    })
    it('can get toString by name', () => {
      const toStringMember = info.getMember('toString')
      expect(toStringMember).not.toBeNull()
    })
    it('includes toString in instance members', () => {
      const members = [...info.members()]
      const toStringMember = members.find(m => m.name == 'toString')
      expect(toStringMember).toBeInstanceOf(Es6MethodInfo)
    })
    describe.each([
      ['static', true],
      ['instance', false],
    ])('%s', (label, isStatic) => {
      it('has correct own members', () => {
        const members = [...info.ownMembers({ isStatic })].filter(m => !m.isKnown)
        expect(members.length > 0).toBe(md.hasOwnMembers == true)
      })    
      it('can get own members by name', () => {
        for (const member of info.ownMembers({ isStatic })) {
          const got = info.getOwnMember(member.name, { isStatic })
          expect(got.equals(member)).toBe(true)
        }
      })
      it('returns null for missing members', () => {
        const missingName = '__missing_member__'
        expect(info.getOwnMember(missingName, { isStatic })).toBe(null)
        expect(info.getMember(missingName, { isStatic })).toBe(null)
      })
      it('returns null for null member name', () => {
        expect(info.getOwnMember(null, { isStatic })).toBe(null)
        expect(info.getMember(null, { isStatic })).toBe(null)
      })    
    })
  })
})

const MySymbol = Symbol('test-symbol')

const ObjectToStringMd = {
  name: 'toString',
  cls: Object,
  toString: 'toString, known method, [es6ClassInfo Object]',
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
  toString: 'constructor, known constructor, [es6ClassInfo Object]',
  type: 'constructor',
  isConstructor: true,
  isKnown: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyClassMemberMd = {
  name: 'member',
  cls: class MyClass { member() { } otherMember() { } },
  type: 'method',
  isMethod: true,
  toString: 'member, method, [es6ClassInfo MyClass]',
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

MyClassMemberMd.cls.prototype.otherMember 
  = MyClassMemberMd.cls.prototype.member
const MyClassOtherMemberMd = {
  name: 'otherMember',
  cls: MyClassMemberMd.cls,
  type: 'method',
  isMethod: true,
  toString: 'otherMember, method, [es6ClassInfo MyClass]',
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyClassConstructorMd = {
  name: 'constructor',
  cls: class MyClass { constructor() { } },
  toString: 'constructor, known constructor, [es6ClassInfo MyClass]',
  type: 'constructor',
  isConstructor: true,
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
  toString: 'member, method, [es6ClassInfo <anonymous>]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyStaticMemberMd = {
  name: 'member',
  cls: class MyClass { static member() { } },
  toString: 'member, static method, [es6ClassInfo MyClass]',
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
  toString: '[Symbol(test-symbol)], method, [es6ClassInfo MyClass]',
  type: 'method',
  isMethod: true,
  isConfigurable: true,
  isWritable: true,
  hasValue: true,
}

const MyStaticSymbolMemberMd = {
  name: MySymbol,
  cls: class MyClass { static [MySymbol]() { } },
  toString: '[Symbol(test-symbol)], static method, [es6ClassInfo MyClass]',
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
  toString: 'member, field [number], [es6ClassInfo MyClass]',
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
  toString: 'member, getter, [es6ClassInfo MyClass]',
  type: 'getter',
  isAccessor: true,
  isGetter: true,
  hasGetter: true,
  isConfigurable: true,
}

const MySetterMd = {
  name: 'member',
  cls: class MyClass { set member(value) { } },
  toString: 'member, setter, [es6ClassInfo MyClass]',
  type: 'setter',
  isAccessor: true,
  isSetter: true,
  hasSetter: true,
  isConfigurable: true,
}

const MyAccessorMd = {
  name: 'member',
  cls: class MyClass { get member() { } set member(value) { } },
  toString: 'member, property, [es6ClassInfo MyClass]',
  type: 'property',
  isAccessor: true,
  isProperty: true,
  hasGetter: true,
  hasSetter: true,
  isConfigurable: true,
}

const Members = [
  ['ObjectToString', ObjectToStringMd],
  ['ObjectConstrutor', ObjectConstrutorMd],
  ['MyClassMember', MyClassMemberMd],
  ['MyClassOtherMember', MyClassOtherMemberMd],
  ['MyClassConstructor', MyClassConstructorMd],
  ['MyAnonMember', MyAnonMemberMd],
  ['MyStaticMember', MyStaticMemberMd],
  ['MySymbolMember', MySymbolMemberMd],
  ['MyStaticSymbolMember', MyStaticSymbolMemberMd],
  ['MyField', MyFieldMd],
  ['MyGetter', MyGetterMd],
  ['MySetter', MySetterMd],
  ['MyAccessor', MyAccessorMd],  
]

describe('Es6MemberInfo', () => {
  describe.each(Members)('%s', (_, md) => {
    let typeInfo
    let info
    beforeEach(() => {
      typeInfo = Es6ClassInfo.from(md.cls)
      info = md.isStatic 
        ? typeInfo.getStaticMember(md.name)
        : typeInfo.getMember(md.name)
    })
    it('should equal itself', () => {
      expect(info.equals(info)).toBe(true)
    })
    it('should be found in members list', () => {
      const members = md.isStatic
        ? [...typeInfo.staticMembers()]
        : [...typeInfo.members()]
      const found = members.find(m => m.equals(info))
      expect(found).not.toBeUndefined()
    })
    it('should equal a different instance of itself', () => {
      const typeInfo = Es6ClassInfo.from(md.cls)
      let otherInfo = md.isStatic
        ? typeInfo.getStaticMember(md.name)
        : typeInfo.getMember(md.name)
      expect(info.equals(otherInfo)).toBe(true)
    })
    it('should not equal null', () => {
      expect(info.equals(null)).toBe(false)
    })
    it('should not equal any other member', () => {
      for (const [_, otherMd] of Members) {
        if (otherMd === md)
          continue
        const typeInfo = Es6ClassInfo.from(otherMd.cls)
        let otherInfo = otherMd.isStatic
          ? typeInfo.getStaticMember(otherMd.name)
          : typeInfo.getMember(otherMd.name)
        expect(info.equals(otherInfo)).toBe(false)
      }
    })
    it('should have expected toString', () => {
      expect(info.toString()).toBe(md.toString)
    })
    it('has expected predicates', () => {
      expect(info.isKnown).toBe(!!md.isKnown)
      expect(info.isNonPublic).toBe(!!md.isNonPublic)
      expect(info.isAbstract).toBe(!!md.isAbstract)

      expect(info.isField).toBe(!!md.isField)
      expect(info.isProperty).toBe(!!md.isProperty)
      expect(info.isGetter).toBe(!!md.isGetter)
      expect(info.isSetter).toBe(!!md.isSetter)
      expect(info.isMethod).toBe(!!md.isMethod)
      expect(info.isConstructor).toBe(!!md.isConstructor)
      expect(info.type).toBe(md.type)
      
      expect(info.isStatic).toBe(!!md.isStatic)

      expect(info.isVisible).toBe(!!md.isEnumerable)
      expect(info.isHidden).toBe(!md.isEnumerable)
      expect(info.isSealed).toBe(!md.isConfigurable)
      expect(info.isConst).toBe(!!md.isField && !md.isWritable)

      expect(info.isFunction).toBe(!!md.isMethod || !!md.isConstructor)
      expect(info.isAccessor).toBe(!!md.isAccessor)
    })
    it('has expected getter, setter, method, ctor, and value', () => {
      if (md.hasGetter) expect(info.getter).toBeInstanceOf(Function)
      else expect(info.getter).toBeUndefined()

      if (md.hasSetter) expect(info.setter).toBeInstanceOf(Function)
      else expect(info.setter).toBeUndefined()

      if (md.isMethod) expect(info.method).toBeInstanceOf(Function)
      else expect(info.method).toBeUndefined()

      if (md.isConstructor) expect(info.ctor).toBeInstanceOf(Function)
      else expect(info.ctor).toBeUndefined()

      if (md.isField) expect(info.value).not.toBeUndefined()
      else expect(info.value).toBeUndefined()
    })
    it('has no root, rootHost, or parent', () => {
      if (!md.parentHost) {
        expect(info.parent()).toBeNull()
        return
      }

      const expectedParentHost = Es6ClassInfo.from(md.parentHost)
      const expectedParent = expectedParentHost.getMember(md.name)

      const expectedRootHost = Es6ClassInfo.from(md.rootHost)
      const expectedRoot = expectedRootHost.getMember(md.name)

      const parent = info.parent()
      expect(parent.equals(expectedParent)).toBe(true)
    })
  })
})
