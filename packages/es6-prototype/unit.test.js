import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Prototype } from '@kingjs/prototype'
import { Es6Prototype } from '@kingjs/es6-prototype'
import { Es6Reflector } from '@kingjs/es6-reflector'

describe('Es6Prototype', () => {
  it('should allow prototype injection given a type', () => {
    const expected = Object.create(null)
    const expectedType = class { }
    const reflector = new Es6Prototype({
      getPrototype: actualType => { 
        expect(actualType).toBe(expectedType)
        return expected 
      }
    })
    const actual = reflector.getPrototype(expectedType)
    expect(actual).toBe(expected)
  })
  it('should allow known type injection', () => {
    const expected = class { }
    const reflector = new Es6Prototype({
      knownTypes: [ expected ]
    })
    expect(reflector.isKnown(expected)).toBe(true)
    expect(reflector.isKnown(expected, 'anyKey')).toBe(true)
    expect(reflector.isKnown(null)).toBe(false)
  })
  it('should allow known key injection', () => {
    const knownKey = 'knownKey'
    const reflector = new Es6Prototype({
      knownKeys: [ knownKey ]
    })
    expect(reflector.isKnownKey(class { }, knownKey)).toBe(true)
  })
  it('should return default prototype if no prototypeFn is given', () => {
    const reflector = new Es6Prototype()
    const MyClass = class { }
    const actual = reflector.getPrototype(MyClass)
    expect(actual).toBe(MyClass.prototype)
  })
})
class MyType { }
class MySubType { }

function runTests(
  memberKey = 'member',
  activate = (options) => new Es6Prototype(options),
) {
  const isSymbol = typeof memberKey === 'symbol'
  
  const MyTypeDescriptors = {
    myTypeMember: { value: 'myType:myTypeMember' },
    [memberKey]: { value: 'myType:member' },
  }
  
  const MySubTypeDescriptors = {
    mySubTypeMember: { value: 'mySubType:mySubTypeMember' },
    [memberKey]: { value: 'mySubType:member' },
  }
  
  const FieldDescriptor = {
    configurable: false,
    enumerable: false,
    writable: false,
  }
  const MyTypeSharedMemberDescriptor = {
    value: 'myType:member',
    ...FieldDescriptor
  }
  const MyTypeMemberDescriptor = {
    value: 'myType:myTypeMember',
    ...FieldDescriptor
  }
  const MyTypeConstructorDescriptor = {
    value: MyType,
    ...FieldDescriptor,
    configurable: true,
  }
  const MySubTypeSharedMemberDescriptor = {
    value: 'mySubType:member',
    ...FieldDescriptor
  }
  const MySubTypeMemberDescriptor = {
    value: 'mySubType:mySubTypeMember',
    ...FieldDescriptor
  }
  const MySubTypeConstructorDescriptor = {
    value: MySubType,
    ...FieldDescriptor,
    configurable: true,
  }
  
  const ctor = 'constructor'
  const MyTypeLinks = [
    { type: MyType, descriptors: MyTypeDescriptors },
  ]
  const MySubTypeLinks = [
    { type: MySubType, descriptors: MySubTypeDescriptors },
    { type: MyType, descriptors: MyTypeDescriptors },
  ]
  
  const SingleChain = {
    type: MyType,
    hierarchy: [ MyType ],
    baseType: null,
    ownKeys: [ ctor, 'myTypeMember', memberKey],
    keys: [ MyType, ctor, 'myTypeMember', memberKey ],
    ownValues: [
      { key: ctor, value: MyType, 
          type: 'field', descriptor: MyTypeConstructorDescriptor }, 
      { key: 'myTypeMember', value: 'myType:myTypeMember',
          type: 'field', descriptor: MyTypeMemberDescriptor },
      { key: memberKey, value: 'myType:member',
          type: 'field', descriptor: MyTypeSharedMemberDescriptor },
    ],
    values: [
      { host: MyType, key: ctor, value: MyType,
          type: 'field', descriptor: MyTypeConstructorDescriptor }, 
      { host: MyType, key: 'myTypeMember', value: 'myType:myTypeMember',
          type: 'field', descriptor: MyTypeMemberDescriptor },
      { host: MyType, key: memberKey, value: 'myType:member',
          type: 'field', descriptor: MyTypeSharedMemberDescriptor },
    ],
    getMemberValue: [
      { host: MyType, value: 'myType:member',
          type: 'field', descriptor: MyTypeSharedMemberDescriptor },
    ],
    ownDescriptors: [
      ctor, MyTypeConstructorDescriptor,
      'myTypeMember', MyTypeMemberDescriptor,
      memberKey, MyTypeSharedMemberDescriptor,
    ],
    descriptors: [
      MyType,
      ctor, MyTypeConstructorDescriptor,
      'myTypeMember', MyTypeMemberDescriptor,
      memberKey, MyTypeSharedMemberDescriptor,
    ],
    getMemberDescriptor: [
      MyType, MyTypeSharedMemberDescriptor,
    ],
    getOwnMemberDescriptor: MyTypeSharedMemberDescriptor,
  }
  
  const SingleChainKnownTypes = {
    type: MyType,
    knownTypes: [ MyType ],
    hierarchy: [ MyType ],
    keys: [ MyType ],
    ownValues: [ ],
    values: [ ],
    getMemberValue: [ ],
    ownDescriptors: [ ],
    getMemberDescriptor: [ ],
    getOwnMemberDescriptor: null,
  }
  
  const SingleChainKnownTypeFn = {
    ...SingleChainKnownTypes,
  }
  delete SingleChainKnownTypeFn.knownTypes
  SingleChainKnownTypeFn.knownTypeFn = 
    type => type === MyType ? true : false
  
  const SingleChainKnownKeys = {
    type: MyType,
    knownKeys: [ memberKey ],
    hierarchy: [ MyType ],
    ownKeys: [ ctor, 'myTypeMember' ],
    keys: [ MyType, ctor, 'myTypeMember' ],
    ownValues: [
      { key: ctor, value: MyType,
          type: 'field', descriptor: MyTypeConstructorDescriptor },  
      { key: 'myTypeMember', value: 'myType:myTypeMember',
          type: 'field', descriptor: MyTypeMemberDescriptor },
    ],
    values: [
      { host: MyType, key: ctor, value: MyType,
          type: 'field', descriptor: MyTypeConstructorDescriptor },
      { host: MyType, key: 'myTypeMember', value: 'myType:myTypeMember',
          type: 'field', descriptor: MyTypeMemberDescriptor },
    ],
    getMemberValue: [ ],
    ownDescriptors: [
      ctor, MyTypeConstructorDescriptor,
      'myTypeMember', MyTypeMemberDescriptor,
    ],
    descriptors: [
      MyType,
      ctor, MyTypeConstructorDescriptor,
      'myTypeMember', MyTypeMemberDescriptor,
    ],
    getMemberDescriptor: [ ],
    getOwnMemberDescriptor: null,
  }
  
  const SingleChainKnownKeyFn = {
    ...SingleChainKnownKeys,
  }
  delete SingleChainKnownKeyFn.knownKeys
  SingleChainKnownKeyFn.knownKeyFn = 
    (type, key) => type === MyType && key === memberKey ? true : false
  
  const MultiChain = {
    type: MySubType,
    hierarchy: [ MySubType, MyType ],
    baseType: MyType,
    baseTypes: [ MyType ],
    ownKeys: [ ctor, 'mySubTypeMember', memberKey ],
    keys: [ 
      MySubType, ctor, 'mySubTypeMember', memberKey, 
      MyType, 'myTypeMember' 
    ],
    ownValues: [
      { key: ctor, value: MySubType,
          type: 'field', descriptor: MySubTypeConstructorDescriptor },
      { key: 'mySubTypeMember', value: 'mySubType:mySubTypeMember',
          type: 'field', descriptor: MySubTypeMemberDescriptor },
      { key: memberKey, value: 'mySubType:member',
          type: 'field', descriptor: MySubTypeSharedMemberDescriptor },
    ],
    values: [
      { host: MySubType, key: ctor, value: MySubType,
          type: 'field', descriptor: MySubTypeConstructorDescriptor },
      { host: MySubType, key: 'mySubTypeMember', value: 'mySubType:mySubTypeMember',
          type: 'field', descriptor: MySubTypeMemberDescriptor },
      { host: MySubType, key: memberKey, value: 'mySubType:member',
          type: 'field', descriptor: MySubTypeSharedMemberDescriptor },
      { host: MyType, key: 'myTypeMember', value: 'myType:myTypeMember',
          type: 'field', descriptor: MyTypeMemberDescriptor },
    ],
    getMemberValue: [
      { host: MySubType, value: 'mySubType:member',
          type: 'field', descriptor: MySubTypeSharedMemberDescriptor },
      { host: MyType, value: 'myType:member',
          type: 'field', descriptor: MyTypeSharedMemberDescriptor },
    ],
    ownDescriptors: [
      ctor, MySubTypeConstructorDescriptor,
      'mySubTypeMember', MySubTypeMemberDescriptor,
      memberKey, MySubTypeSharedMemberDescriptor,
    ],
    descriptors: [
      MySubType,
      ctor, MySubTypeConstructorDescriptor,
      'mySubTypeMember', MySubTypeMemberDescriptor,
      memberKey, MySubTypeSharedMemberDescriptor,
      MyType,
      'myTypeMember', MyTypeMemberDescriptor,
    ],
    getMemberDescriptor: [
      MySubType, MySubTypeSharedMemberDescriptor,
      MyType, MyTypeSharedMemberDescriptor,
    ],
    getOwnMemberDescriptor: MySubTypeSharedMemberDescriptor,
  }
  
  const MultiChainIncludeOverridden = {
    type: MySubType,
    hierarchy: [ MySubType, MyType ],
    baseType: MyType,
    baseTypes: [ MyType ],
    includeOverridden: true,
    ownKeys: [ ctor, 'mySubTypeMember', memberKey ],
    keys: [ 
      MySubType, ctor, 'mySubTypeMember', memberKey, 
      MyType, ctor, 'myTypeMember', memberKey 
    ],
    values: [
      { host: MySubType, key: ctor, value: MySubType,
          type: 'field', descriptor: MySubTypeConstructorDescriptor }, 
      { host: MySubType, key: 'mySubTypeMember', value: 'mySubType:mySubTypeMember',
          type: 'field', descriptor: MySubTypeMemberDescriptor },
      { host: MySubType, key: memberKey, value: 'mySubType:member',
          type: 'field', descriptor: MySubTypeSharedMemberDescriptor },
      { host: MyType, key: ctor, value: MyType,
          type: 'field', descriptor: MyTypeConstructorDescriptor },
      { host: MyType, key: 'myTypeMember', value: 'myType:myTypeMember',
          type: 'field', descriptor: MyTypeMemberDescriptor },
      { host: MyType, key: memberKey, value: 'myType:member',
          type: 'field', descriptor: MyTypeSharedMemberDescriptor },
    ],
    getMemberValue: [
      { host: MySubType, value: 'mySubType:member',
          type: 'field', descriptor: MySubTypeSharedMemberDescriptor },
      { host: MyType, value: 'myType:member',
          type: 'field', descriptor: MyTypeSharedMemberDescriptor },
    ],
    ownDescriptors: [
      ctor, MySubTypeConstructorDescriptor,
      'mySubTypeMember', MySubTypeMemberDescriptor,
      memberKey, MySubTypeSharedMemberDescriptor,
    ],
    descriptors: [
      MySubType,
      ctor, MySubTypeConstructorDescriptor,
      'mySubTypeMember', MySubTypeMemberDescriptor,
      memberKey, MySubTypeSharedMemberDescriptor,
      MyType,
      ctor, MyTypeConstructorDescriptor,
      'myTypeMember', MyTypeMemberDescriptor,
      memberKey, MyTypeSharedMemberDescriptor,
    ],
    getMemberDescriptor: [
      MySubType, MySubTypeSharedMemberDescriptor,
      MyType, MyTypeSharedMemberDescriptor,
    ],
    getOwnMemberDescriptor: MySubTypeSharedMemberDescriptor,
  }
  
  const TestCases = [
    ['Single chain', SingleChain],
    ['Multi chain', MultiChain],
    ['Include overridden', MultiChainIncludeOverridden],
    ['Known types', SingleChainKnownTypes],
    ['Known keys', SingleChainKnownKeys],
    ['Known type fn', SingleChainKnownTypeFn],
    ['Known key fn', SingleChainKnownKeyFn],
  ]
  
  describe.each(TestCases)('%s', (_, { 
    type, 
    hierarchy, baseType = null, baseTypes = [],
    knownTypes = [], knownKeys = [], 
    knownTypeFn = null, knownKeyFn = null,
    ownKeys = [], keys = [], includeOverridden = false,
    ownValues = null, values = null, getMemberValue = null,
    ownDescriptors = null, descriptors = null, getMemberDescriptor = null,
    getOwnMemberDescriptor = undefined,
  }) => {

    let reflector
    beforeEach(() => {
      reflector = activate({
        knownKeys: knownKeys,
        knownTypes: knownTypes,
        knownTypeFn: knownTypeFn,
        knownKeyFn: knownKeyFn,
        getPrototype(type) {
          const links = type === MyType ? MyTypeLinks
            : type === MySubType ? MySubTypeLinks
            : null
          expect(links).not.toBeNull()
          return Prototype.reduce(links)
        }
      })

      // stable sort ownKeys so symbols come after strings
      ownKeys.sort((a, b) => {
        const aIsSymbol = typeof a === 'symbol'
        const bIsSymbol = typeof b === 'symbol'
        if (aIsSymbol && !bIsSymbol) return 1
        if (!aIsSymbol && bIsSymbol) return -1
        return 0
       })
    })
  
    // hierarchy
    it('should have expected hierarchy', () => {
      const actual = [...reflector.hierarchy(type)]
      expect(actual).toEqual(hierarchy)
    })
    it('should have expected base type', () => {
      const actual = reflector.getBaseType(type)
      expect(actual).toBe(baseType)
    })
    it('should have expected base types', () => {
      const actual = [...reflector.baseTypes(type)]
      expect(actual).toEqual(baseTypes)
    })
  
    // keys
    it('should have expected own keys', () => {
      const actual = [...reflector.ownKeys(type)]
      expect(actual).toEqual(ownKeys)
      for (const key of ownKeys)
        expect(reflector.hasOwnKey(type, key)).toBe(true)
      for (const key of knownKeys)
        expect(reflector.hasOwnKey(type, key)).toBe(false)
    })
    it('should have expected keys', () => {
      const actual = [...reflector.keys(type, { includeOverridden })]
      expect(actual).toEqual(keys)
      for (const key of keys) {
        if (typeof key === 'function') continue
        expect(reflector.hasKey(type, key)).toBe(true)
      }
      for (const key of knownKeys)
        expect(reflector.hasKey(type, key)).toBe(false)
    })
  
    // values
    it('should have expected own values', () => {
      if (!ownValues) return
      const actual = [...reflector.ownValues(type)]
      expect(actual).toEqual(ownValues)
    })
    it('should have expected values', () => {
      if (!values) return
      const actual = [...reflector.values(type, { includeOverridden })]
      expect(actual).toEqual(values)
    })
    it('should have expected member value', () => {
      if (!getMemberValue) return
      const actual = [...reflector.findValues(type, memberKey)]
      expect(actual).toEqual(getMemberValue)
    })
    it('should get expected member value', () => {
      if (!getMemberValue) return
      const expected = getMemberValue[0]?.value ?? null
      const actual = reflector.getValue(type, memberKey)
      expect(actual).toEqual(expected)
    })
    it('should get expected contextual member value', () => {
      if (!getMemberValue) return
      const { descriptor, ...expected } = getMemberValue[0] ?? { }
      const actual = reflector.getValue(type, memberKey, { context: true })
      expect(actual).toEqual(expected.value === undefined ? null : expected)
    })
  
    // descriptors
    it('should have expected own descriptors', () => {
      if (!ownDescriptors) return
      const actual = [...reflector.ownDescriptors(type)]
      expect(actual).toEqual(ownDescriptors)
    })
    it('should have expected member descriptor', () => {
      if (!getMemberDescriptor) return
      const actual = [...reflector.findDescriptors(type, memberKey)]
      expect(actual).toEqual(getMemberDescriptor)
    })
    it('should get expected member descriptor', () => {
      if (!getMemberDescriptor) return
      const expected = getMemberDescriptor[1] ?? null
      const actual = reflector.getDescriptor(type, memberKey)
      expect(actual).toEqual(expected)
    })
    it('should have expected member getter presence', () => {
      if (!getMemberDescriptor) return
      const descriptor = getMemberDescriptor[1]
      const expected = descriptor?.get !== undefined
      const actual = reflector.hasGetter(type, memberKey)
      expect(actual).toBe(expected)
    })
    it('should have expected member setter presence', () => {
      if (!getMemberDescriptor) return
      const descriptor = getMemberDescriptor[1]
      const expected = descriptor?.set !== undefined
      const actual = reflector.hasSetter(type, memberKey)
      expect(actual).toBe(expected)
    })
    it('should get expected contextual member descriptor', () => {
      if (!getMemberDescriptor) return
      const [host, descriptor] = getMemberDescriptor
      const expected = descriptor ? { host, descriptor } : null
      const actual = reflector.getDescriptor(type, memberKey, {
        context: true,
      })
      expect(actual).toEqual(expected)
    })
    it('should have expected descriptors', () => {
      if (!descriptors) return
      const actual = [...reflector.descriptors(type, { includeOverridden })]
      expect(actual).toEqual(descriptors)
    })
    it('should have expected own member descriptor', () => {
      if (getOwnMemberDescriptor === undefined) return
      const actual = reflector.getOwnDescriptor(type, memberKey)
      expect(actual).toEqual(getOwnMemberDescriptor)
    })
  
    it('should return nothing for unknown member value', () => {
      const actual = [...reflector.findValues(type, 'unknownMember')]
      expect(actual).toEqual([ ])
    })
    it('should return nothing for unknown own descriptor', () => {
      const actual = reflector.getOwnDescriptor(type, 'unknownMember')
      expect(actual).toBeNull()
    })
  })

  class MyQuackerType {
    get property() { }
    set property(value) { }
    method() { }
    constructor() {
      this.field = 42
    }
  }

  const Tests = {
    MyGetterType: {
      type: class MyGetterType {
        get property() { }
      },
    },
    MySetterType: {
      type: class MySetterType {
        set property(value) { }
      },
    },
    MyPropertyType: {
      type: class MyPropertyType {
        get property() { }
        set property(value) { }
      },
    },
    MyMethodType: {
      type: class MyMethodType {
        method() { }
      },
    },
    MyDataType: {
      type: class MyDataType {
        static { this.prototype.field = 42 }
      },
    },
    MyDataAsGetterType: {
      type: class MyDataAsGetterType {
        get field() { }
      },
    },
    MyGooseType: {
      type: class MyGooseType {
        honk() { }
      },
      canDuckCast: false,
      canStrictDuckCast: false,
    },
    MyGetterAsMethod: {
      type: class MyGetterAsMethod {
        get method() { }
      },
      canStrictDuckCast: false,
    },  
    MyMethodAsGetter: {
      type: class MyMethodAsGetter {
        property() { }
      },
      canDuckCast: false,
      canStrictDuckCast: false,
    },
  }

  describe('Quacker', () => {

    describe.each(Object.entries(Tests))('%s', (_, { 
      type, canDuckCast = true, canStrictDuckCast = true }) => {

      let reflector
      let instance
      beforeEach(() => {
        reflector = activate()
        instance = new MyQuackerType()
      })

      it ('should have expected duck castability', () => {
        const actual = reflector.canDuckCast(type, instance)
        expect(actual).toBe(canDuckCast)
      })
      it ('should have expected strict duck castability', () => {
        const actual = reflector.canStrictDuckCast(type, instance)
        expect(actual).toBe(canStrictDuckCast)
      })
    })
  })
  
  describe('Value filters', () => {
    class MyGetterFilter {
      get member() { return 'value' }
    }
  
    const CtorValue = { key: 'constructor', value: MyGetterFilter }
    const HostCtorValue = { ...CtorValue, host: MyGetterFilter }
    const NoFilterTest = {
      type: MyGetterFilter,
      key: 'member',
      value: 'value',
      descriptorType: null,
      instanceOf: null,
      ownValues: [ CtorValue, { key: 'member', value: 'value' } ],
      gotValue: [ { host: MyGetterFilter, value: 'value' } ],
      values: [ HostCtorValue, 
        { host: MyGetterFilter, key: 'member', value: 'value' } ],
    }
    const DescriptorTypeTest = {
      ...NoFilterTest,
      descriptorType: 'getter',
      ownValues: [ { key: 'member', value: 'value' } ],
      gotValue: [ { host: MyGetterFilter, value: 'value' } ],
      values: [ { host: MyGetterFilter, key: 'member', value: 'value' } ],
    }
    const InstanceOfTest = {
      ...NoFilterTest,
      instanceOf: String,
      ownValues: [ { key: 'member', value: 'value' } ],
      gotValue: [ { host: MyGetterFilter, value: 'value' } ],
      values: [ { host: MyGetterFilter, key: 'member', value: 'value' } ],
    }
    const NegativeDescriptorTypeTest = {
      ...NoFilterTest,
      descriptorType: 'data',
      ownValues: [ ],
      gotValue: [ ],
      values: [ ],
    }
    const NegativeInstanceOfTest = {
      ...NoFilterTest,
      instanceOf: Number,
      ownValues: [ ],
      gotValue: [ ],
      values: [ ],
    }
    
    const ValueTestCases = [
      ['No filter', NoFilterTest],
      ['Descriptor type filter', DescriptorTypeTest],
      ['Value type filter', InstanceOfTest],
      ['Negative descriptor type filter', NegativeDescriptorTypeTest],
      ['Negative value type filter', NegativeInstanceOfTest],
    ]
    describe.each(ValueTestCases)('%s', (_, { 
      type, key, value,
      descriptorType, instanceOf,
      ownValues, values, gotValue,
     }) => {
  
      let reflector
      let options
      beforeEach(() => {
        reflector = activate({
          knownTypes: [ Object ],
        })
        options = { descriptorType, instanceOf }
      })
  
      // findValues
      it('should have expected member value', () => {
        const actual = [...reflector.findValues(type, key, options)]
        actual.forEach(v => { delete v.type; delete v.descriptor })
        expect(actual).toEqual(gotValue)
      })

      // getValue
      it('should have expected first member value', () => {
        const actual = reflector.getValue(type, key, options)
        expect(actual).toEqual(gotValue[0]?.value ?? null)
      })

      // ownValues
      it('should have expected own value', () => {
        const actual = [...reflector.ownValues(type, options)]
        actual.forEach(v => { delete v.type; delete v.descriptor })
        expect(actual).toEqual(ownValues)
      })

      // values
      it('should have expected value', () => {
        const actual = [...reflector.values(type, options)]
        actual.forEach(v => { delete v.type; delete v.descriptor })
        expect(actual).toEqual(values)
      })
    })
  })
}

describe('Key as string', () => { runTests('member') })
describe('Key as symbol', () => { runTests(Symbol('member')) })
describe('Reflector', () => {
  describe('Key as string', () => { 
    runTests('member', options => Es6Reflector.create(options)) })
  describe('Key as symbol', () => { 
    runTests(Symbol('member'), options => Es6Reflector.create(options)) })
})

