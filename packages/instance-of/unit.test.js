import { describe, it, expect } from 'vitest'
import { instanceOf } from '@kingjs/instance-of'

// null and undefined
const NullTest = {
  value: null,
  isInstanceOf: [ ],
  isNotInstanceOf: Object
}
const UndefinedTest = { 
  value: undefined,
  isInstanceOf: [ ],
  isNotInstanceOf: Object
}

// primitives
const StringTest = {
  value: '',
  isInstanceOf: [ String, Object ],
  isNotInstanceOf: Number
}
const NumberTest = {
  value: 0,
  isInstanceOf: [ Number, Object ],
  isNotInstanceOf: String
}
const BooleanTest = {
  value: false,
  isInstanceOf: [ Boolean, Object ],
  isNotInstanceOf: String
}
const SymbolTest = {
  value: Symbol(),
  isInstanceOf: [ Symbol, Object ],
  isNotInstanceOf: String
}
const BigIntTest = {
  value: BigInt(0),
  isInstanceOf: [ BigInt, Object ],
  isNotInstanceOf: String
}

// objects
const ObjectTest = {
  value: {},
  isInstanceOf: [ Object ],
  isNotInstanceOf: String
}
const FunctionTest = {
  value() { },
  isInstanceOf: [ Function, Object ],
  isNotInstanceOf: String
}
const ArrayTest = {
  value: [],
  isInstanceOf: [ Array, Object ],
  isNotInstanceOf: String
}

class MyClass { }
class MyExtendedClass extends MyClass { }
class MyClassExtendsConcept { }
class MyConcept { 
  static [Symbol.hasInstance](instance) {
    return instance.constructor == MyClassExtendsConcept
  }
}

const MyClassTest = {
  value: new MyClass(),
  isInstanceOf: [ MyClass, Object ],
  isNotInstanceOf: String
}
const MyExtendedClassTest = {
  value: new MyExtendedClass(),
  isInstanceOf: [ MyExtendedClass, MyClass, Object ],
  isNotInstanceOf: String
}
const MyClassExtendsConceptTest = {
  value: new MyClassExtendsConcept(),
  isInstanceOf: [ MyConcept ],
  isNotInstanceOf: String
}

const TestCases = [
  ['null', NullTest],
  ['undefined', UndefinedTest],

  ['String', StringTest],
  ['Number', NumberTest],
  ['Boolean', BooleanTest],
  ['Symbol', SymbolTest],
  ['BigInt', BigIntTest],

  ['Object', ObjectTest],
  ['Function', FunctionTest],
  ['Array', ArrayTest],

  ['MyClass', MyClassTest],
  ['MyExtendedClass', MyExtendedClassTest],
  ['MyClassExtendsConcept', MyClassExtendsConceptTest],
]

describe.each(TestCases)('A %s', (_, { 
  value, isInstanceOf, isNotInstanceOf }) => {
  for (const type of isInstanceOf) {
    it(`is instanceOf ${type.name}`, () => {
      expect(instanceOf(value, type)).toBe(true)
    })
  }

  it(`is not instanceOf ${isNotInstanceOf.name}`, () => {
    expect(instanceOf(value, isNotInstanceOf)).toBe(false)
  })
})