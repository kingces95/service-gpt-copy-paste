import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { isAbstract } from '@kingjs/abstract'

const NullTest = {
  name: 'null',
  type: null,
  baseType: null,
}

const ObjectTest = {
  name: 'Object',
  type: Object,
  baseType: null,
}

const FunctionTest = {
  name: 'Function',
  type: Function,
  baseType: Object,
}

class MyClass { }
class MyClassExtendsNull extends null { }
class MyExtendedClass extends MyClass { }

const MyClassTest = {
  name: 'MyClass',
  type: MyClass,
  baseType: Object,
}

const MyClassExtendsNullTest = {
  name: 'MyClassExtendsNull',
  type: MyClassExtendsNull,
  baseType: null,
  isAbstract: true,
}

const MyExtendedClassTest = {
  name: 'MyExtendedClass',
  type: MyExtendedClass,
  baseType: MyClass,
}

const tests = [
  [NullTest.name, NullTest],
  [ObjectTest.name, ObjectTest],
  [FunctionTest.name, FunctionTest],
  [MyClassTest.name, MyClassTest],
  [MyClassExtendsNullTest.name, MyClassExtendsNullTest],
  [MyExtendedClassTest.name, MyExtendedClassTest]
]

describe.each(tests)('%s', (_, test) => {
  let type, baseType
  beforeEach(() => {
    ({ type, baseType } = test)
  })
  it(`should have correct base type`, () => {
    const result = Es6Reflect.baseType(type)
    expect(result).toBe(baseType)
  })
  it('should have correct isAbstract result', () => {
    if (!type) return
    const expected = !!test.isAbstract
    const actual = Es6Reflect.isAbstract(type)
    expect(actual).toBe(expected)
  })
})