import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialMetadata, isMetadata } from '@kingjs/partial-reflect'
import { Prototype } from '@kingjs/prototype'

describe('isMetadata', () => {
  class MyClass { }
  const IsMetadataTests = [
    ['null', null, true],
    ['undefined', undefined, true],
    ['object', { }, true],
    ['type', Object, true],
    ['Function', Function, true],
    ['number', 42, true],
    ['string', 'hello', true],
    ['boolean', true, true],
    ['symbol', Symbol('sym'), true],
    ['array', [], true],
    ['composed array', [
      null, undefined, { }, 
      Object, Function, 42, 'hello', 
      true, Symbol('sym'), []
    ], true],
    ['composed object', {
      nll: null, undef: undefined, object: { }, 
      type: Object, Function, number: 42, string: 'hello', 
      boolean: true, symbol: Symbol('sym'), array: []
    }, true],
    ['composed array with instance', [ new MyClass() ], false],
    ['composed object with instance', { instance: new MyClass() }, false],
    ['instance', new MyClass(), false],
  ]
  describe.each(IsMetadataTests)('%s', (_, value, expected) => {
    it(`should return ${expected}`, () => {
      const result = isMetadata(value)
      expect(result).toBe(expected)
    })
  })
})

describe('metadata', () => {
  class NoMetadataClass { 
    static value = function() { }
  }
  class MetadataClass { 
    static value = 'value'
  }
  const MetadataSymbol = Symbol('metadata')
  class MetadataSymbolClass {
    static [MetadataSymbol] = 'metadata symbol value'
  }
  class ExtendedMetadataClass extends MetadataClass { }

  const HiddenConst = {
    configurable: true,
    enumerable: false,
    writable: false,
  }
  const UserField = {
    configurable: true,
    enumerable: true,
    writable: true,
  }
  const ObjectMetadata = {
    constructor: { value: Object, ...HiddenConst },
  }
  const NoMetadataTest = {
    name: 'NoMetadataClass',
    type: NoMetadataClass,
    links: [ 
      {
        constructor: { value: NoMetadataClass, ...HiddenConst },
      },
      ObjectMetadata,
    ],
  }
  const MetadataTest = {
    name: 'MetadataClass',
    type: MetadataClass,
    links: [
      {
        constructor: { value: MetadataClass, ...HiddenConst },
        value: { value: 'value', ...UserField },
      },
      ObjectMetadata,
    ],
  }
  const ExtendedMetadataTest = {
    name: 'ExtendedMetadataClass',
    type: ExtendedMetadataClass,
    links: [
      {
        constructor: { value: ExtendedMetadataClass, ...HiddenConst },
      },
      {
        constructor: { value: MetadataClass, ...HiddenConst },
        value: { value: 'value', ...UserField },
      },
      ObjectMetadata,
    ]
  }
  const MetadataSymbolTest = {
    name: 'MetadataSymbolClass',
    type: MetadataSymbolClass,
    links: [
      {
        constructor: { value: MetadataSymbolClass, ...HiddenConst },
        [MetadataSymbol]: { value: 'metadata symbol value', ...UserField },
      },
      ObjectMetadata,
    ] 
  }
  
  const tests = [
    [NoMetadataTest.name, NoMetadataTest],
    [MetadataTest.name, MetadataTest],
    [ExtendedMetadataTest.name, ExtendedMetadataTest],
    [MetadataSymbolTest.name, MetadataSymbolTest],
  ]
  
  describe.each(tests)('%s', (_, { type, links }) => {
    it('should have correct metadata links', () => {
      const expectedChain = [...links]
      const actualChain = Prototype.deconstruct(
        PartialMetadata.getPrototype(type))
      
      expect(actualChain.length).toBe(expectedChain.length)

      let actualLink = null
      let expectedLink = expectedChain.shift()
      do { 
        actualLink = actualChain.shift()
        const actualDescriptors = Object.getOwnPropertyDescriptors(actualLink)
        const expectedDescriptors = expectedLink
        expect(actualDescriptors).toEqual(expectedDescriptors)
      } while (expectedLink = expectedChain.shift())      
    })
  })
})

