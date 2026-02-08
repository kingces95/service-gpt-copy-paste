import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Reflect } from '@kingjs/es6-reflect'

const ObjectMd = {
  name: 'Object',
  type: Object,
  isKnown: true,
  chain: [ Object ],
}

const FunctionMd = {
  name: 'Function',
  type: Function,
  isKnown: true,
  chain: [ Function, Object ],
}

const MyFunction = function() { }
const MyFunctionMd = {
  name: 'MyFunction',
  type: MyFunction,
  chain: [ MyFunction, Object ],
  isKnown: false,
}

const MyClass = class { 
  static staticMember() { }
  static staticBaseMember() { }
  member() { }
  baseMember() { }
}
const MyClassMd = {
  name: 'MyClass',
  type: MyClass,
  chain: [ MyClass, Object ],
  static: {
    ownKeys: [ 'staticMember', 'staticBaseMember' ],
    keys: [ 'staticMember', 'staticBaseMember' ],
    ownMembers: [ 
      [ 'staticMember', MyClass ],
      [ 'staticBaseMember', MyClass ],
    ],
    members: [ 
      [ 'staticMember', MyClass ],
      [ 'staticBaseMember', MyClass ],
    ],
    hierarchy: {
      staticMember: [ 
        MyClass, MyClass.staticMember, 
        Object ],
      staticBaseMember: [ 
        MyClass, MyClass.staticBaseMember, 
        Object ],
    },
  },
  instance: {
    ownKeys: [ 'member', 'baseMember' ],
    keys: [ 'member', 'baseMember' ],
    ownMembers: [ 
      [ 'member', MyClass ],
      [ 'baseMember', MyClass ],
    ],
    members: [ 
      [ 'member', MyClass ],
      [ 'baseMember', MyClass ],
    ],
    hierarchy: {
      member: [ 
        MyClass, MyClass.prototype.member, 
        Object ],
      baseMember: [ 
        MyClass, MyClass.prototype.baseMember, 
        Object ],
    },
  },
}

const MyExtendedClass = class extends MyClass { 
  static staticMember() { }
  static extendedStaticMember() { }
  member() { }
  extendedMember() { }
}
const MyExtendedClassMd = {
  name: 'MyExtendedClass',
  type: MyExtendedClass,
  baseType: MyClass,
  chain: [ MyExtendedClass, MyClass, Object ],
  static: {
    ownKeys: [ 'staticMember', 'extendedStaticMember' ],
    keys: [ 'staticMember', 'extendedStaticMember', 'staticBaseMember' ],
    ownMembers: [
      [ 'staticMember', MyExtendedClass ],
      [ 'extendedStaticMember', MyExtendedClass ],
    ],
    members: [
      [ 'staticMember', MyExtendedClass ],
      [ 'extendedStaticMember', MyExtendedClass ],
      [ 'staticBaseMember', MyClass ],
    ],
    hierarchy: {
      staticMember: [ 
        MyExtendedClass, MyExtendedClass.staticMember, 
        MyClass, MyClass.staticMember, 
        Object ],
      staticBaseMember: [ 
        MyExtendedClass, 
        MyClass, MyClass.staticBaseMember, 
        Object ],
      extendedStaticMember: [ 
        MyExtendedClass, MyExtendedClass.extendedStaticMember, 
        MyClass, 
        Object ],
    },
  },
  instance: {
    ownKeys: [ 'member', 'extendedMember' ],
    keys: [ 'member', 'extendedMember', 'baseMember' ],
    ownMembers: [
      [ 'member', MyExtendedClass ],
      [ 'extendedMember', MyExtendedClass ],
    ],
    members: [
      [ 'member', MyExtendedClass ],
      [ 'extendedMember', MyExtendedClass ],
      [ 'baseMember', MyClass ],
    ],
    hierarchy: {
      member: [ 
        MyExtendedClass, MyExtendedClass.prototype.member, 
        MyClass, MyClass.prototype.member, 
        Object ],
      baseMember: [ 
        MyExtendedClass, 
        MyClass, MyClass.prototype.baseMember, 
        Object ],
      extendedMember: [ 
        MyExtendedClass, MyExtendedClass.prototype.extendedMember, 
        MyClass, 
        Object ],
    },
  },
}

const Classes = [
  [ObjectMd.name, ObjectMd],
  [FunctionMd.name, FunctionMd],
  [MyFunctionMd.name, MyFunctionMd],
  [MyClassMd.name, MyClassMd],
  [MyExtendedClassMd.name, MyExtendedClassMd],
]

// test Es6Reflect
describe.each(Classes)('%s', (_, classMd) => {

  let type
  beforeEach(() => {
    ({ type } = classMd)
  })

  it('has correct isKnown result', () => {
    const expected = !!classMd.isKnown
    const actual = Es6Reflect.isKnown(type)
    expect(actual).toBe(expected)
  })

  it('is an extension of its base type', () => {
    const { baseType } = classMd
    if (!baseType)
      return

    expect(Es6Reflect.isExtensionOf(type, baseType)).toBe(true)
    expect(Es6Reflect.isExtensionOf(baseType, type)).toBe(false)
  })

  it('has correct hierarchy', () => {
    const expected = classMd.chain
    const actual = [...Es6Reflect.hierarchy(type)]
    expect(actual).toEqual(expected)
  })

  describe.each([
    ['static', true], 
    ['instance', false]
  ])('%s', (label, isStatic) => {
    let prototype
    let md
    beforeEach(() => {
      prototype = isStatic ? type : type.prototype
      md = classMd?.[label]
    })

    it('has correct member hierarchy', () => {
      const members = md?.hierarchy || { }
      for (const key in members) {
        const expected = members[key]
        const actual = [...Es6Reflect.hierarchy(
          type, key, { isStatic, excludeKnown: true })].map(value => {
            if (typeof value == 'object') return value.value
            return value
          })
        expect(actual).toEqual(expected)
      }
    })

    it('has correct own keys', () => {
      const expected = md?.ownKeys || []
      const actual = [...Es6Reflect.ownKeys(type, { isStatic })]
        .filter(name => Es6Reflect.isKnownKey(type, name, { isStatic }) === false)
      // sort for comparison
      expected.sort()
      actual.sort()
      expect(actual).toEqual(expected)
    })

    it('has correct members', () => {
      const expected = md?.members || []
      const actual = []
      let owner
      for (const current of Es6Reflect.keys(
        type, { isStatic, excludeKnown: true })) {
        switch (typeof current) {
          case 'function': owner = current; continue
          case 'string':
          case 'symbol': actual.push([current, owner]); break
          default: assert(false, `Unexpected type: ${typeof current}`)
        }
      }
      expect(actual).toEqual(expected)
    })

    it('has correct members including known ones', () => {
      const expected = keys(type, isStatic)
      const actual = {}
      let owner
      for (const current of Es6Reflect.keys(
        type, { isStatic, excludeKnown: false })) {
        switch (typeof current) {
          case 'function': owner = current; continue
          case 'string':
          case 'symbol': 
            // so __proto__ shows up in the keys
            Object.defineProperty(
              actual, current, { value: true, enumerable: true })
            break
          default: assert(false, `Unexpected type: ${typeof current}`)
        }
      }

      expect(actual).toEqual(expected)
    })

    it('has correct own descriptors', () => {
      const expected = {}
      for (const [name] of md?.members || [])
        expected[name] = Object.getOwnPropertyDescriptor(
          isStatic ? type : type.prototype,
          name)

      const actual = {}
      let key, descriptor
      for (const current of Es6Reflect.ownDescriptors(
        type, { isStatic, excludeKnown: true })) {
        switch (typeof current) {
          case 'string': key = current; continue
          case 'symbol': key = current; continue
          case 'object': descriptor = current; break
          default: assert(false, `Unexpected type: ${typeof current}`)
        }
        actual[key] = descriptor
      }

      expect(actual).toEqual(expected)
    })

    it('has correct descriptors', () => {
      const expected = {}
      for (const [name, owner] of md?.members || [])
        expected[name] = Object.getOwnPropertyDescriptor(
          isStatic ? owner : owner.prototype,
          name)

      const actual = {}
      let key, owner, descriptor
      for (const current of Es6Reflect.descriptors(
        type, { isStatic, excludeKnown: true })) {
        switch (typeof current) {
          case 'string': key = current; continue
          case 'symbol': key = current; continue
          case 'function': owner = current; continue
          case 'object': descriptor = current; break
          default: assert(false, `Unexpected type: ${typeof current}`)
        }
        actual[key] = descriptor
      }

      expect(actual).toEqual(expected)
    })

    it('can get each own descriptor', () => {
      for (const [name, owner] of md?.ownMembers || []) {
        const expected = Object.getOwnPropertyDescriptor(
          isStatic ? owner : owner.prototype,
          name)
        const actual = Es6Reflect.getOwnDescriptor(
          type, name, { isStatic, excludeKnown: true })
        expect(actual).toEqual(expected)
      }
    })

    it('can get each descriptor', () => {
      for (const [name, owner] of md?.members || []) {
        const expected = Object.getOwnPropertyDescriptor(
          isStatic ? owner : owner.prototype,
          name)
        let actual
        for (const current of Es6Reflect.getDescriptor(
          type, name, { isStatic, excludeKnown: true })) {
          switch (typeof current) {
            case 'function': actual = null; continue
            case 'object': actual = current; break
            default: assert(false, `Unexpected type: ${typeof current}`)
          }
        }
        expect(actual).toEqual(expected)
      }
    })
  })
})

function keys(type, isStatic) {
  const result = { }

  let prototype = isStatic ? type : type.prototype
  while (prototype) {
    if (isStatic && prototype == Function.prototype) break
    for (const key of Reflect.ownKeys(prototype))
      Object.defineProperty(result, key, { value: true, enumerable: true })
    prototype = Object.getPrototypeOf(prototype)
  }

  return result
}