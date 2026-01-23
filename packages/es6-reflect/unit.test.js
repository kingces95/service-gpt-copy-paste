import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Reflect } from '@kingjs/es6-reflect'

const ObjectMd = {
  name: 'Object',
  type: Object,
  isKnown: true,
  static: {
    chain: [ Object ],
  },
  instance: {
    chain: [ Object ],
  },
}

const FunctionMd = {
  name: 'Function',
  type: Function,
  isKnown: true,
  static: {
    chain: [ Function ],
  },
  instance: {
    chain: [ Function, Object ],
  },
}

const MyFunction = function() { }
const MyFunctionMd = {
  name: 'MyFunction',
  type: MyFunction,
  static: {
    chain: [ MyFunction ],
  },
  instance: {
    chain: [ MyFunction, Object ],
  },
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
  static: {
    chain: [ MyClass ],
    ownKeys: [ 'staticMember', 'staticBaseMember' ],
    members: [ 
      [ 'staticMember', MyClass ],
      [ 'staticBaseMember', MyClass ],
    ],
  },
  instance: {
    chain: [ MyClass, Object ],
    ownKeys: [ 'member', 'baseMember' ],
    members: [ 
      [ 'member', MyClass ],
      [ 'baseMember', MyClass ],
    ],
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
  static: {
    chain: [ MyExtendedClass, MyClass ],
    ownKeys: [ 'staticMember', 'extendedStaticMember' ],
    members: [
      [ 'staticMember', MyExtendedClass ],
      [ 'extendedStaticMember', MyExtendedClass ],
      [ 'staticBaseMember', MyClass ],
    ],
  },
  instance: {
    chain: [ MyExtendedClass, MyClass, Object ],
    ownKeys: [ 'member', 'extendedMember' ],
    members: [
      [ 'member', MyExtendedClass ],
      [ 'extendedMember', MyExtendedClass ],
      [ 'baseMember', MyClass ],
    ],
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

  describe.each([
    ['static', true], 
    ['instance', false]
  ])('%s', (label, isStatic) => {
    it('has correct hierarchy', () => {
      const expected = classMd[label].chain
      const actual = [...Es6Reflect.hierarchy(type, { isStatic })]
      expect(actual).toEqual(expected)
    })

    it('has correct own keys', () => {
      const expected = classMd[label].ownKeys || []
      const actual = [...Es6Reflect.ownKeys(type, { isStatic })]
        .filter(name => Es6Reflect.isKnownKey(type, name, { isStatic }) === false)
      // sort for comparison
      expected.sort()
      actual.sort()
      expect(actual).toEqual(expected)
    })

    it('has correct members', () => {
      const expected = classMd[label].members || []
      const actual = [...Es6Reflect.keys(type, { 
        isStatic, 
        excludeKnown: true,
        includeContext: true })]
      // sort for comparison
      expected.sort(([lhs], [rhs]) => lhs.localeCompare(rhs))
      actual.sort(([lhs], [rhs]) => lhs.localeCompare(rhs))
      expect(actual).toEqual(expected)
    })

    it('has correct members including known ones', () => {
      const expected = keys(type, isStatic)

      const actual = Object.fromEntries(
        [...Es6Reflect.keys(type, { 
          isStatic,
          excludeKnown: false })]
        .map((name) => [name, true])
      )
      expect(actual).toEqual(expected)
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