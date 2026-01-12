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
  staticChain: [ ],
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
  instanceKeys: [ 'member', 'baseMember' ],
  staticKeys: [ 'staticMember', 'staticBaseMember' ],
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
  staticChain: [ MyExtendedClass, MyClass ],
  instanceChain: [ MyExtendedClass, MyClass, Object ],
  isKnown: false,
  ownInstanceKeys: [ 'member', 'extendedMember' ],
  ownStaticKeys: [ 'staticMember', 'extendedStaticMember' ],
  instanceKeys: [ 'member', 'extendedMember', 'baseMember' ],
  staticKeys: [ 'staticMember', 'extendedStaticMember', 'staticBaseMember' ],
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
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct own static keys', () => {
    const expected = classMd.ownStaticKeys || []
    const actual = [...Es6Reflect.ownStaticKeys(type)]
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct instance keys', () => {
    const expected = classMd.instanceKeys || []
    const actual = [...Es6Reflect.instanceKeys(type)]
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct static keys', () => {
    const expected = classMd.staticKeys || []
    const actual = [...Es6Reflect.staticKeys(type)]
    // sort for comparison
    expected.sort()
    actual.sort()
    expect(actual).toEqual(expected)
  })
  it('has correct isKnown result', () => {
    const expected = classMd.isKnown
    const actual = Es6Reflect.isKnown(type)
    expect(actual).toBe(expected)
  })
})
