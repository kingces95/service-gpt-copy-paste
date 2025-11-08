import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialClass, PartialClassReflect } from '@kingjs/partial-class'

describe('PartialClass', () => {
  it('cannot be instantiated', () => {
    expect(() => new PartialClass()).toThrow()
  })
})

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should yield no own declarations', () => {
    const declarations = [...PartialClassReflect.ownDeclarations(type)]
    expect(declarations).toHaveLength(0)
  })
})

describe('A custom MyPartialClass applied to a type', () => {
  let myType
  let myExtensionMethod
  let mySubExtensionMethod
  let MyPartialClass
  let MyDeclarationSymbol = Symbol('MyDeclaration')
  let MySubExtension
  let MyExtension 
  let preConditionCalled, compileCalled, bindCalled, postConditionCalled

  beforeEach(() => {
    preConditionCalled = false
    compileCalled = false
    bindCalled = false
    postConditionCalled = false

    MyPartialClass = class MyPartialClass extends PartialClass { 
      static [PartialClass.Symbol.ownDeclaraitionSymbols] = 
        { [MyDeclarationSymbol]: { expectedType: MyPartialClass } }
    }

    myExtensionMethod = function() { }
    mySubExtensionMethod = function() { }

    MySubExtension = class extends MyPartialClass { }
    MySubExtension.prototype.method = mySubExtensionMethod

    MyExtension = class extends MyPartialClass { 
      static [MyDeclarationSymbol] = [ MySubExtension ]
    }

    myType = class { }
  })

  describe('with myExtensionMethod applied', () => {
    beforeEach(() => {
      MyExtension.prototype.method = myExtensionMethod
      MyExtension.defineOn(myType)
    })

    it('should ultimatly have myExtensionMethod applied', () => {
      expect(myType.prototype.method).toBe(myExtensionMethod)
      // not mySubExtensionMethod
      expect(myType.prototype.method).not.toBe(mySubExtensionMethod)
    })
  })

  describe('with a bind the returns null', () => {
    beforeEach(() => {
      MyPartialClass[PartialClass.Symbol.bind] = function(
        type$, name, descriptor) {
        expect(type$).toBe(myType)
        expect(name).toBe('method')
        expect(descriptor.value).toBe(mySubExtensionMethod)
        return null
      }

      MyExtension.defineOn(myType)
    })

    it('should skip the member', () => {
      expect(myType.prototype.method).toBeUndefined()
    })
  })

  describe('with kitchen sink callbacks', () => { 
    beforeEach(() => {
      MyPartialClass[PartialClass.Symbol.preCondition] = function(type) {
        preConditionCalled = true
        expect(compileCalled).toBeFalsy()
        expect(bindCalled).toBeFalsy()
        expect(postConditionCalled).toBeFalsy() 
        expect(type).toBe(myType)
      }

      MyPartialClass[PartialClass.Symbol.compile] = function(descriptor) {
        compileCalled = true
        expect(preConditionCalled).toBeTruthy()
        expect(bindCalled).toBeFalsy()
        expect(postConditionCalled).toBeFalsy() 
        expect(descriptor.value).toBe(mySubExtensionMethod)

        expect(descriptor.enumerable).toBe(true)
        descriptor.enumerable = false
        return descriptor 
      }

      MyPartialClass[PartialClass.Symbol.bind] = function(type, key, descriptor) {
        bindCalled = true
        expect(preConditionCalled).toBeTruthy()
        expect(compileCalled).toBeTruthy()
        expect(postConditionCalled).toBeFalsy()
        expect(type).toBe(myType)
        expect(key === 'method')
        expect(descriptor.value).toBe(mySubExtensionMethod)

        expect(descriptor.enumerable).toBe(false)
        return descriptor 
      }

      MyPartialClass[PartialClass.Symbol.postCondition] = function(type) {
        postConditionCalled = true
        expect(preConditionCalled).toBeTruthy()
        expect(compileCalled).toBeTruthy()
        expect(bindCalled).toBeTruthy()
        expect(type).toBe(myType)
      }
  
      MyExtension.defineOn(myType)
    })
    it('should have the method', () => {
      expect(myType.prototype.method).toBe(mySubExtensionMethod)
    })
    it('should call all PartialClass callbacks', () => {
      expect(preConditionCalled).toBe(true)
      expect(compileCalled).toBe(true)
      expect(bindCalled).toBe(true)
      expect(postConditionCalled).toBe(true)
    })
  })
})