import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { es6CreateThunk } from '@kingjs/es6-create-thunk'
import { Es6Compiler } from '@kingjs/es6-compiler'

function getterFn() {
  this.push('get')
  this.push([...arguments])
  if (this.throw) throw new Error('getter error')
  return 'result'
}
function setterFn(value) {
  this.push('set')
  this.push([...arguments])
  if (this.throw) throw new Error('setter error')
}
function methodFn(value) {
  this.push('method')
  this.push([...arguments]) 
  if (this.throw) throw new Error('method error')
  return 'result' 
}

const getter = {
  descriptor: { get: getterFn },
  hasGetter: true,
}

const setter = {
  descriptor: { set: setterFn },
  hasSetter: true,
}

const method = {
  descriptor: { value: methodFn },
  hasMethod: true,
}

const property = {
  descriptor: {
    get: getterFn,
    set: setterFn,
  },
  hasGetter: true,
  hasSetter: true,
}

const field = {
  descriptor: {
    value: 42,
  },
  hasField: true,
}

const tests = [
  ['getter', getter],
  ['setter', setter],
  ['method', method],
  ['property', property],
  ['field', field],
]

describe('An empty thunk', () => {
  let thunk
  let descriptor = { value: 42 }
  beforeEach(() => {
    thunk = es6CreateThunk(descriptor)
  })

  it('returns the compiled descriptor', () => {
    expect(thunk).toEqual(Es6Compiler.emit(descriptor))
  })
})


describe.each(tests)('A %s thunk', (_, { descriptor, ...flags }) => {
  const typePrecondition = function() { 
    this.push('typePrecondition')
    this.push([...arguments])
  }
  const typePostcondition = function() { 
    this.push('typePostcondition') 
    this.push([...arguments])
  }

  const precondition = function() { 
    this.push('precondition')
    this.push([...arguments])
  }
  const postcondition = function() { 
    this.push('postcondition') 
    this.push([...arguments])
  }

  const getterPrecondition = function() { 
    this.push('getterPrecondition')
    this.push([...arguments])
  }
  const getterPostcondition = function() { 
    this.push('getterPostcondition') 
    this.push([...arguments])
  }

  const setterPrecondition = function() { 
    this.push('setterPrecondition')
    this.push([...arguments])
  }
  const setterPostcondition = function() { 
    this.push('setterPostcondition') 
    this.push([...arguments])
  }

  describe.each([
    ['all conditions', { 
      hasTypePrecondition: true,
      hasTypePostcondition: true,
      hasPrecondition: true,
      hasPostcondition: true,
    }],
    ['type precondition', { hasTypePrecondition: true }],
    ['type postcondition', { hasTypePostcondition: true }],

    ['member precondition', { hasPrecondition: true }],
    ['member postcondition', { hasPostcondition: true }],

    ['getter precondition', { hasGetterPrecondition: true }],
    ['getter postcondition', { hasGetterPostcondition: true }],

    ['setter precondition', { hasSetterPrecondition: true }],
    ['setter postcondition', { hasSetterPostcondition: true }],

  ])('with %s', (_, {
    hasTypePrecondition, hasTypePostcondition,
    hasPrecondition, hasPostcondition,
    hasGetterPrecondition, hasGetterPostcondition,
    hasSetterPrecondition, hasSetterPostcondition,
  }) => {
    let thunk
    beforeEach(() => {
      thunk = es6CreateThunk(descriptor, {
        type: { 
          precondition: hasTypePrecondition ? [typePrecondition] : null,
          postcondition: hasTypePostcondition ? [typePostcondition] : null,
        },
        precondition: {
          value: hasPrecondition ? [precondition] : null,
          get: hasGetterPrecondition ? [getterPrecondition] : null, 
          set: hasSetterPrecondition ? [setterPrecondition] : null,
        },
        postcondition: {
          value: hasPostcondition ? [postcondition] : null,
          get: hasGetterPostcondition ? [getterPostcondition] : null, 
          set: hasSetterPostcondition ? [setterPostcondition] : null,
        }
      })
    })
  
    describe.each([
      ['get', descriptor.get],
      ['set', descriptor.set],
      ['value', descriptor.value],
    ])('property %s', (key, value) => {
  
      // getter, setter, property, method
      if (typeof value == 'function') {
        it('should have correct __target', () => {
          expect(thunk[key].__target).toBe(value)
        })
        it('should have correct name', () => {
          expect(thunk[key].name).toBe(value.name + '_thunk')
        })
      }
  
      // field
      else if (value !== undefined) {
        it('should have correct value', () => {
          expect(thunk[key]).toBe(value)
        })
      } 
  
      // none of the above
      else {
        it('should be undefined', () => {
          expect(thunk[key]).toBeUndefined()
        })
      }
    })
  
    it('should have correct descriptor properties', () => {
      const expected = Es6Compiler.emit(descriptor)
      expect(thunk.enumerable).toBe(expected.enumerable)
      expect(thunk.configurable).toBe(expected.configurable)
      expect(thunk.writable).toBe(expected.writable)
    })

    describe.each([
      ['throws', true],
      ['returns', false],
    ])('%s', (_, throws) => {
      if (flags.hasGetter) {
        it('thunks the getter', () => {
          const context = []
          if (throws) context.throw = true

          let result
          try { result = thunk.get.call(context) }
          catch (error) { }

          expect(result).toBe(throws ? undefined : 'result')
    
          const expected = []
          if (throws) expected.throw = true

          if (hasTypePrecondition) 
            expected.push('typePrecondition', [])
          if (hasPrecondition) 
            expected.push('precondition', [])
          if (hasGetterPrecondition)
            expected.push('getterPrecondition', [])

          expected.push('get', [])
          
          if (!throws) {
            if (hasPostcondition) 
              expected.push('postcondition', ['result'])
            if (hasGetterPostcondition)
              expected.push('getterPostcondition', ['result'])
          }
          if (hasTypePostcondition) 
            expected.push('typePostcondition', [])
          expect(context).toEqual(expected)
        })
      }
    
      if (flags.hasSetter) {
        it('thunks the setter', () => {
          const context = []
          if (throws) context.throw = true

          try { thunk.set.call(context, 'a0') }
          catch (error) { }
    
          const expected = []
          if (throws) expected.throw = true

          if (hasTypePrecondition) 
            expected.push('typePrecondition', [])
          if (hasPrecondition) 
            expected.push('precondition', ['a0'])
          if (hasSetterPrecondition)
            expected.push('setterPrecondition', ['a0'])

          expected.push('set', ['a0'])
          
          if (!throws) {
            if (hasPostcondition) 
              expected.push('postcondition', [])
            if (hasSetterPostcondition)
              expected.push('setterPostcondition', [])
          }
          if (hasTypePostcondition) 
            expected.push('typePostcondition', [])
          expect(context).toEqual(expected)
        })
      }
    
      if (flags.hasMethod) {
        it('thunks the method', () => {
          const context = []
          if (throws) context.throw = true

          let result
          try { result = thunk.value.call(context, 'a0', 'a1') }
          catch (error) { }
          
          expect(result).toBe(throws ? undefined : 'result')
          
          const expected = []
          if (throws) expected.throw = true

          if (hasTypePrecondition) 
            expected.push('typePrecondition', [])
          if (hasPrecondition) 
            expected.push('precondition', ['a0', 'a1'])
          
          expected.push('method', ['a0', 'a1'])
          
          if (!throws) {
            if (hasPostcondition) 
              expected.push('postcondition', ['result'])
          }
          if (hasTypePostcondition) 
            expected.push('typePostcondition', [])
          expect(context).toEqual(expected)
        })
      }
    })
  })
})