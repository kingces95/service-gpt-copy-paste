import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Prototype } from '@kingjs/prototype'

const ObjectTest = {
  name: 'Object',
  type: Object,
  prototype: Object.prototype,
  chain: [Object.prototype],
  reduction: Prototype.reduce([{
    type: Object,
    descriptors: Object.getOwnPropertyDescriptors(Object.prototype),
  }]),
  hasOwnKey: 'toString',
  hasKey: 'toString',
  ownKeys: Reflect.ownKeys(Object.prototype),
  getOwnDescriptor: Object.getOwnPropertyDescriptor(Object.prototype, 'toString'),
  getDescriptor: Object.getOwnPropertyDescriptor(Object.prototype, 'toString'),
  getDescriptorHost: Object,
}

const FunctionTest = {
  name: 'Function',
  type: Function,
  prototype: Function.prototype,
  chain: [Function.prototype, Object.prototype],
  reduction: Prototype.reduce([{
    type: Function,
    descriptors: Object.getOwnPropertyDescriptors(Function.prototype),
  }, {
    type: Object,
    descriptors: Object.getOwnPropertyDescriptors(Object.prototype),
  }]),
  hasOwnKey: 'apply',
  hasKey: 'apply',
  ownKeys: Reflect.ownKeys(Function.prototype),
  getOwnDescriptor: Object.getOwnPropertyDescriptor(Function.prototype, 'apply'),
  getDescriptor: Object.getOwnPropertyDescriptor(Function.prototype, 'apply'),
  getDescriptorHost: Function,
}

const PrototypeTests = [
  ['Object', ObjectTest],
  ['Function', FunctionTest],
]

describe.each(PrototypeTests)('%s', (_, { 
  type, prototype, reduction, chain,
  hasOwnKey, hasKey, ownKeys, getOwnDescriptor,
  getDescriptor, getDescriptorHost,
}) => {

  it('should have correct prototype chain', () => {
    const expectedChain = chain
    const actualChain = [...Prototype.chain(prototype)]
    
    expect(actualChain.length).toBe(expectedChain.length)
    for (let i = 0; i < expectedChain.length; i++)
      expect(actualChain[i]).toBe(expectedChain[i])
  })

  it('should have correct hasOwnKey', () => {
    expect(Prototype.hasOwnKey(prototype, hasOwnKey)).toBe(true)
  })

  it('should have correct hasKey', () => {
    expect(Prototype.hasKey(prototype, hasKey)).toBe(true)
  })

  it('should have correct hasGetter', () => {
    expect(Prototype.hasGetter(prototype, hasKey)).toBe(false)
  })

  it('should have correct hasSetter', () => {
    expect(Prototype.hasSetter(prototype, hasKey)).toBe(false)
  })

  it('should have correct ownKeys', () => {
    const expectedOwnKeys = ownKeys
    const actualOwnKeys = [...Prototype.ownKeys(prototype)]
    
    expect(actualOwnKeys.length).toBe(expectedOwnKeys.length)
    for (let i = 0; i < expectedOwnKeys.length; i++)
      expect(actualOwnKeys[i]).toBe(expectedOwnKeys[i])
  })

  it('should have correct getOwnDescriptor', () => {
    const expectedDescriptor = getOwnDescriptor
    const actualDescriptor = Prototype.getOwnDescriptor(prototype, hasOwnKey)
    
    expect(actualDescriptor).toEqual(expectedDescriptor)
  })

  it('should have correct getDescriptor', () => {
    const actualDescriptor = Prototype.getDescriptor(prototype, hasKey)

    expect(actualDescriptor).toEqual(getDescriptor)
  })

  it('should have correct contextual getDescriptor', () => {
    const actual = Prototype.getDescriptor(prototype, hasKey, {
      context: true,
    })

    expect(actual).toEqual({
      host: getDescriptorHost,
      descriptor: getDescriptor,
    })
  })

  it('should return null for missing getDescriptor', () => {
    const actualDescriptor = Prototype.getDescriptor(prototype, 'missing')

    expect(actualDescriptor).toBeNull()
  })

  it('should return false for missing hasGetter', () => {
    expect(Prototype.hasGetter(prototype, 'missing')).toBe(false)
  })

  it('should return false for missing hasSetter', () => {
    expect(Prototype.hasSetter(prototype, 'missing')).toBe(false)
  })

  it('should have correct getValue', () => {
    const actualValue = Prototype.getValue(prototype, hasKey, {
      instance: prototype,
    })

    expect(actualValue).toEqual(prototype[hasKey])
  })

  it('should have correct contextual getValue', () => {
    const actual = Prototype.getValue(prototype, hasKey, {
      instance: prototype,
      context: true,
    })

    expect(actual.value).toEqual(prototype[hasKey])
    expect(actual.host).toBe(getDescriptorHost)
    expect(actual.type).toBe('data')
    expect('key' in actual).toBe(false)
    expect('descriptor' in actual).toBe(false)
  })

  it('should return null for missing getValue', () => {
    const actualValue = Prototype.getValue(prototype, 'missing')

    expect(actualValue).toBeNull()
  })

  describe.each([
    ['reduction', reduction],
    ['original', prototype],
  ])('%s', (_, expectedPrototype) => {
    let actualChain
    beforeEach(() => {
      actualChain = [...Prototype.deconstruct(expectedPrototype)]
    })
    it('each link should have no prototype', () => {
      for (const link of actualChain)
        expect(Object.getPrototypeOf(link)).toBe(null)
    })
    it('each link should have same descriptors as prototype', () => {
      const expectedChain = [...chain]
      expect(actualChain.length).toBe(expectedChain.length)
      for (let i = 0; i < expectedChain.length; i++) {
        const expectedDescriptors = Object.getOwnPropertyDescriptors(
          expectedChain[i])
        const actualDescriptors = Object.getOwnPropertyDescriptors(
          actualChain[i])
        expect(actualDescriptors).toEqual(expectedDescriptors)
      }
    })
  })
})

class BaseGet {
  get value() { return 'base' }
}

class BaseSet {
  set value(value) { this.value$ = value }
}

class DerivedSetOverBaseGet extends BaseGet {
  static baseType = BaseGet
  static baseSlot = 'get'
  static derivedSlot = 'set'

  set value(value) { this.value$ = value }
}

class DerivedGetOverBaseSet extends BaseSet {
  static baseType = BaseSet
  static baseSlot = 'set'
  static derivedSlot = 'get'

  get value() { return 'derived' }
}

class DerivedGetOverBaseGet extends BaseGet {
  static baseType = BaseGet
  static baseSlot = 'get'
  static derivedSlot = 'get'

  get value() { return 'derived' }
}

class DerivedSetOverBaseSet extends BaseSet {
  static baseType = BaseSet
  static baseSlot = 'set'
  static derivedSlot = 'set'

  set value(value) { this.value$ = value }
}

const SplitAccessorTests = [
  {
    name: 'derived set over base get',
    type: DerivedSetOverBaseGet,
    findValues: ['base'],
    getValue: null,
    values: [],
    splitSlots: ['get', 'set'],
    splitDescriptorSlots: ['set', 'get'],
    splitValue: 'base',
    splitValues: ['base'],
  },
  {
    name: 'derived get over base set',
    type: DerivedGetOverBaseSet,
    findValues: ['derived'],
    getValue: 'derived',
    values: ['derived'],
    splitSlots: ['get', 'set'],
    splitDescriptorSlots: ['get', 'set'],
    splitValue: 'derived',
    splitValues: ['derived'],
  },
  {
    name: 'derived get over base get',
    type: DerivedGetOverBaseGet,
    findValues: ['derived', 'base'],
    getValue: 'derived',
    values: ['derived'],
    splitSlots: ['get'],
    splitDescriptorSlots: ['get'],
    splitValue: 'derived',
    splitValues: ['derived'],
  },
  {
    name: 'derived set over base set',
    type: DerivedSetOverBaseSet,
    findValues: [],
    getValue: null,
    values: [],
    splitSlots: ['set'],
    splitDescriptorSlots: ['set'],
    splitValue: null,
    splitValues: [],
  },
]

describe.each(SplitAccessorTests)(
  'split accessors: $name',
  ({
    type,
    findValues,
    getValue,
    values,
    splitSlots,
    splitDescriptorSlots,
    splitValue,
    splitValues,
  }) => {

  const { baseType, baseSlot, derivedSlot } = type

  it('findDescriptors searches raw slots', () => {
    const actual = [...Prototype.findDescriptors(type.prototype, 'value')]

    expect(actual[0]).toBe(type)
    expect(actual[1][derivedSlot]).toBeDefined()
    expect(actual[2]).toBe(baseType)
    expect(actual[3][baseSlot]).toBeDefined()
  })

  it('findValues searches readable slots', () => {
    const actual = [...Prototype.findValues(type.prototype, 'value', {
      instance: createInstance(),
    })]

    expect(actual.map(({ value }) => value)).toEqual(findValues)
  })

  it('getDescriptor returns the runtime descriptor without splitAccessors', () => {
    const actual = Prototype.getDescriptor(type.prototype, 'value')

    expect(hasSlot(actual, derivedSlot)).toBe(true)
    expect(hasSlot(actual, otherSlot(derivedSlot))).toBe(false)
  })

  it('getDescriptor resolves slots with splitAccessors', () => {
    const actual = Prototype.getDescriptor(type.prototype, 'value', {
      splitAccessors: true,
    })

    expect(hasSlot(actual, 'get')).toBe(splitSlots.includes('get'))
    expect(hasSlot(actual, 'set')).toBe(splitSlots.includes('set'))
  })

  it('hasGetter reads the runtime slot without splitAccessors', () => {
    expect(Prototype.hasGetter(type.prototype, 'value'))
      .toBe(derivedSlot == 'get')
  })

  it('hasGetter reads the resolved slot with splitAccessors', () => {
    expect(Prototype.hasGetter(type.prototype, 'value', {
      splitAccessors: true,
    })).toBe(splitSlots.includes('get'))
  })

  it('hasSetter reads the runtime slot without splitAccessors', () => {
    expect(Prototype.hasSetter(type.prototype, 'value'))
      .toBe(derivedSlot == 'set')
  })

  it('hasSetter reads the resolved slot with splitAccessors', () => {
    expect(Prototype.hasSetter(type.prototype, 'value', {
      splitAccessors: true,
    })).toBe(splitSlots.includes('set'))
  })

  it('getValue reads the runtime slot without splitAccessors', () => {
    const actual = Prototype.getValue(type.prototype, 'value', {
      instance: createInstance(),
    })

    expect(actual).toBe(getValue)
  })

  it('getValue reads the resolved slot with splitAccessors', () => {
    const actual = Prototype.getValue(type.prototype, 'value', {
      instance: createInstance(),
      splitAccessors: true,
    })

    expect(actual).toBe(splitValue)
  })

  it('descriptors suppresses by key without splitAccessors', () => {
    const actual = descriptors()

    expect(actual).toHaveLength(1)
    expect(hasSlot(actual[0], derivedSlot)).toBe(true)
    expect(hasSlot(actual[0], otherSlot(derivedSlot))).toBe(false)
  })

  it('descriptors suppresses by accessor slot with splitAccessors', () => {
    const actual = descriptors({ splitAccessors: true })

    expect(actual.map(slotsOf)).toEqual(splitDescriptorSlots)
  })

  it('values projects runtime-readable descriptors without splitAccessors', () => {
    const actual = valuesOf()

    expect(actual).toEqual(values)
  })

  it('values projects resolved readable slots with splitAccessors', () => {
    const actual = valuesOf({ splitAccessors: true })

    expect(actual).toEqual(splitValues)
  })

  it('keys suppresses by key without splitAccessors', () => {
    const actual = keys()

    expect(actual).toEqual(['value'])
  })

  it('keys preserves split accessor key hits with splitAccessors', () => {
    const actual = keys({ splitAccessors: true })

    expect(actual).toEqual(splitDescriptorSlots.map(() => 'value'))
  })

  it('copyTo materializes the runtime descriptor without splitAccessors', () => {
    const actual = copyTo()

    expect(hasSlot(actual, derivedSlot)).toBe(true)
    expect(hasSlot(actual, otherSlot(derivedSlot))).toBe(false)
  })

  it('copyTo materializes merged accessor halves with splitAccessors', () => {
    const actual = copyTo({ splitAccessors: true })

    expect(hasSlot(actual, 'get')).toBe(splitSlots.includes('get'))
    expect(hasSlot(actual, 'set')).toBe(splitSlots.includes('set'))
  })

  function createInstance() {
    return new type()
  }

  function descriptors(options = { }) {
    return [...Prototype.descriptors(type.prototype, {
      ...options,
      filter: (host, key) => key === 'value',
    })].filter(current => typeof current == 'object')
  }

  function valuesOf(options = { }) {
    return [...Prototype.values(type.prototype, {
      instance: createInstance(),
      ...options,
      filter: (host, key) => key === 'value',
    })].map(({ value }) => value)
  }

  function keys(options = { }) {
    return [...Prototype.keys(type.prototype, {
      ...options,
      filter: (host, key) => key === 'value',
    })].filter(current => current === 'value')
  }

  function copyTo(options = { }) {
    const target = { }
    Prototype.copyTo(type.prototype, target, {
      ...options,
      filter: (host, key) => key === 'value',
    })
    return Object.getOwnPropertyDescriptor(target, 'value')
  }
})

function hasSlot(descriptor, slot) {
  return descriptor[slot] !== undefined
}

function slotsOf(descriptor) {
  if (hasSlot(descriptor, 'get')) return 'get'
  if (hasSlot(descriptor, 'set')) return 'set'
}

function otherSlot(slot) {
  return slot == 'get' ? 'set' : 'get'
}
