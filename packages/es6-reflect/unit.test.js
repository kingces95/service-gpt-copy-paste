import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Reflect } from '@kingjs/es6-reflect'

const ObjectMd = {
  name: 'Object',
  type: Object,
  staticChain: [ Object ],
  instanceChain: [ Object ],
  isKnown: true,
}

const FunctionMd = {
  name: 'Function',
  type: Function,
  staticChain: [ Function ],
  instanceChain: [ Function, Object ],
  isKnown: true,
}

const MyFunction = function() { }
const MyFunctionMd = {
  name: 'MyFunction',
  type: MyFunction,
  staticChain: [ MyFunction ],
  instanceChain: [ MyFunction, Object ],
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
  staticChain: [ MyClass ],
  instanceChain: [ MyClass, Object ],
  isKnown: false,
  ownInstanceKeys: [ 'member', 'baseMember' ],
  ownStaticKeys: [ 'staticMember', 'staticBaseMember' ],
  instanceMembers: [ 
    [ 'baseMember', MyClass ],
    [ 'member', MyClass ],
  ],
  staticMembers: [
    [ 'staticMember', MyClass ],
    [ 'staticBaseMember', MyClass ],
  ]
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
  staticChain: [ MyExtendedClass, MyClass ],
  instanceChain: [ MyExtendedClass, MyClass, Object ],
  isKnown: false,
  ownInstanceKeys: [ 'member', 'extendedMember' ],
  ownStaticKeys: [ 'staticMember', 'extendedStaticMember' ],
  instanceMembers: [ 
    [ 'member', MyExtendedClass ],
    [ 'extendedMember', MyExtendedClass ],
    [ 'baseMember', MyClass ],
  ],
  staticMembers: [
    [ 'staticMember', MyExtendedClass ],
    [ 'extendedStaticMember', MyExtendedClass ],
    [ 'staticBaseMember', MyClass ],
  ]
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
    const expected = classMd.isKnown
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
  it('has correct instance hierarchy', () => {
    const expected = classMd.instanceChain
    const actual = [...Es6Reflect.instanceHierarchy(type)]
    expect(actual).toEqual(expected)
  })
  it('has correct static hierarchy', () => {
    const expected = classMd.staticChain
    const actual = [...Es6Reflect.staticHierarchy(type)]
    expect(actual).toEqual(expected)
  })
  it('has correct own instance keys', () => {
    const expected = classMd.ownInstanceKeys || []
    const actual = [...Es6Reflect.ownInstanceKeys(type)]
      .filter(name => Es6Reflect.isKnownInstanceKey(type, name) === false)
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct own static keys', () => {
    const expected = classMd.ownStaticKeys || []
    const actual = [...Es6Reflect.ownStaticKeys(type)]
      .filter(name => Es6Reflect.isKnownStaticKey(type, name) === false)
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct instance members', () => {
    const expected = [...(classMd.instanceMembers || [])]
      .map(([name]) => name)
    const actual = [...Es6Reflect.instanceMembers(type)]
      .filter(([name, type]) => Es6Reflect.isKnownInstanceKey(type, name) === false)
      .map(([name]) => name)
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct static members', () => {
    const expected = [...(classMd.staticMembers || [])]
      .map(([name]) => name)
    const actual = [...Es6Reflect.staticMembers(type)]
      .filter(([name, type]) => Es6Reflect.isKnownStaticKey(type, name) === false)
      .map(([name]) => name)
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct instance members', () => {
    const expected = classMd.instanceMembers || []
    const actual = [...Es6Reflect.instanceMembers(type)]
      .filter(([name, type]) => Es6Reflect.isKnownInstanceKey(type, name) === false)
    expected.sort(([lhs], [rhs]) => lhs.localeCompare(rhs))
    actual.sort(([lhs], [rhs]) => lhs.localeCompare(rhs))
    expect(actual).toEqual(expected)
  })
  it('has correct static members', () => {
    const expected = classMd.staticMembers || []
    const actual = [...Es6Reflect.staticMembers(type)]
      .filter(([name, type]) => Es6Reflect.isKnownStaticKey(type, name) === false)
    expected.sort(([lhs], [rhs]) => lhs.localeCompare(rhs))
    actual.sort(([lhs], [rhs]) => lhs.localeCompare(rhs))
    expect(actual).toEqual(expected)
  })
  it('has expected instance keys including known ones', () => {
    const expected = keys(type, false)

    const actual = Object.fromEntries(
      [...Es6Reflect.instanceMembers(type)]
      .map(([name]) => [name, true])
    )
    expect(actual).toEqual(expected)
  })
  it('has expected static keys including known ones', () => {
    const expected = keys(type, true)

    const actual = Object.fromEntries(
      [...Es6Reflect.staticMembers(type)]
      .map(([name]) => [name, true])
    )
    expect(actual).toEqual(expected)
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