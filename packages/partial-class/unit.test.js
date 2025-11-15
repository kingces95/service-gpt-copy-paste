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
  it('should yield no declarations', () => {
    const declarations = [...PartialClassReflect.declarations(type)]
    expect(declarations).toHaveLength(0)
  })
})

describe('Extension', () => {
  let ExtensionSymbol = Symbol('ExtensionSymbol')
  let Extension
  
  beforeEach(() => {
    Extension = class Extension extends PartialClass { 
      static [PartialClass.Symbol.ownDeclaraitionSymbols] = 
        { [ExtensionSymbol]: { expectedType: Extension } }
    }
  })

  it('should not be recognized as a partial class', () => {
    expect(PartialClassReflect.isPartialClass(Extension)).toBe(false)
  })
  it('should return null for its partial class', () => {
    expect(PartialClassReflect.getPartialClass(Extension)).toBe(null)
  })

  describe('MyExtension', () => {
    let MyExtension 
  
    beforeEach(() => {
      MyExtension = class extends Extension { }
    })

    it('should be recognized as partial classes', () => {
      expect(PartialClassReflect.isPartialClass(MyExtension)).toBe(true)
    })
    it('should return Extension as their partial class', () => {
      expect(PartialClassReflect.getPartialClass(MyExtension)).toBe(Extension)
    })
    it('should have no own declarations', () => {
      const declarations = [...PartialClassReflect.ownDeclarations(MyExtension)]
      expect(declarations).toHaveLength(0)
    })
    it('should have no declarations', () => {
      const declarations = [...PartialClassReflect.declarations(MyExtension)]
      expect(declarations).toHaveLength(0)
    })

    describe('with MySubExtension', () => {
      let MySubExtension
    
      beforeEach(() => {
        MySubExtension = class extends Extension { }
        MyExtension[ExtensionSymbol] = [ MySubExtension ]
      })

      it('should have MySubExtension as own declaration', () => {
        const declarations = [...PartialClassReflect.ownDeclarations(MyExtension)]
        expect(declarations).toEqual([ MySubExtension ])
      })

      describe('with MySubSubExtension', () => {
        let MySubSubExtension

        beforeEach(() => {
          MySubSubExtension = class extends Extension { }
          MySubExtension[ExtensionSymbol] = [ MySubSubExtension ]
        })

        it('should have MySubExtension and MySubSubExtension as declarations', () => {
          const declarations = [...PartialClassReflect.declarations(MyExtension)]
          expect(declarations).toEqual([ 
            MySubExtension,
            MySubSubExtension
          ])
        })
      })

      describe('with mySubExtesnionMethod', () => {
        let myType
        let mySubExtensionMethod
      
        beforeEach(() => {
          mySubExtensionMethod = function() { }
          MySubExtension.prototype.method = mySubExtensionMethod
          myType = class { }
        })
      
        describe('with myExtensionMethod', () => {
          let myExtensionMethod
          
          beforeEach(() => {
            myExtensionMethod = function() { }
            MyExtension.prototype.method = myExtensionMethod
            MyExtension.defineOn(myType)
          })
      
          it('should apply myExtensionMethod', () => {
            expect(myType.prototype.method).toBe(myExtensionMethod)
            // not mySubExtensionMethod
            expect(myType.prototype.method).not.toBe(mySubExtensionMethod)
          })
        })
      
        describe('with a bind the returns null', () => {
          beforeEach(() => {
            Extension[PartialClass.Symbol.bind] = function(
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
          let preConditionCalled
          let compileCalled
          let bindCalled
          let postConditionCalled
      
          beforeEach(() => {
            preConditionCalled = false
            compileCalled = false
            bindCalled = false
            postConditionCalled = false
      
            Extension[PartialClass.Symbol.preCondition] = function(type) {
              preConditionCalled = true
              expect(compileCalled).toBeFalsy()
              expect(bindCalled).toBeFalsy()
              expect(postConditionCalled).toBeFalsy() 
              expect(type).toBe(myType)
            }
      
            Extension[PartialClass.Symbol.compile] = function(descriptor) {
              compileCalled = true
              expect(preConditionCalled).toBeTruthy()
              expect(bindCalled).toBeFalsy()
              expect(postConditionCalled).toBeFalsy() 
              expect(descriptor.value).toBe(mySubExtensionMethod)
      
              expect(descriptor.enumerable).toBe(true)
              descriptor.enumerable = false
              return descriptor 
            }
      
            Extension[PartialClass.Symbol.bind] = function(type, key, descriptor) {
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
      
            Extension[PartialClass.Symbol.postCondition] = function(type) {
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
    })
  })
})