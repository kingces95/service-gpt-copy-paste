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
}

const PrototypeTests = [
  ['Object', ObjectTest],
  ['Function', FunctionTest],
]

describe.each(PrototypeTests)('%s', (_, { 
  type, prototype, reduction, chain,
  hasOwnKey, hasKey, ownKeys, getOwnDescriptor,  
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