import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { Extensions } from '@kingjs/partial-extensions'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { PartialType, Compile, Declarations } from '@kingjs/partial-type'
import { extend } from '@kingjs/partial-extend'
import { Extensions } from '@kingjs/partial-extensions'
import { Define } from '@kingjs/partial-symbols'

function *partialTypes(type) {
  for (const current of PartialReflect.baseTypes(type)) {
    if (!PartialReflect.isExtensionOf(
      current, PartialType, { minDepth: 2 })) continue
    yield current
  }
}

function getPartialType(type) {
  let current = type
  while (current = PartialReflect.getExtendedType(current)) {
    if (PartialReflect.getExtendedType(current) == PartialType)
      return current
  }
  return null
}

function isKey(key) {
  return typeof key === 'string' || typeof key === 'symbol'
}

describe('PartialType', () => {
  it('cannot be instantiated', () => {
    expect(() => new PartialType()).toThrow()
  })
  it('cannot be the target of mergeMembers', () => {
    expect(() => extend(PartialType)).toThrow()
  })
})

describe('An abstract type', () => {
  let type
  beforeEach(() => {
    type = class extends null { }
  })
  it('should be abstract', () => {
    expect(Es6Reflect.isAbstract(type)).toBe(true)
  })
})

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should yield no declarations', () => {
    const declarations = [...partialTypes(type)]
    expect(declarations).toHaveLength(0)
  })
  it('should not be abstract', () => {
    expect(Es6Reflect.isAbstract(type)).toBe(false)
  })

  describe('after merging a method', () => {
    let method
    beforeEach(() => {
      method = function method() { }
      extend(type, 
        Extensions[Define]({ method }))
    })

    it('should have the method', () => {
      expect(type.prototype.method).toBe(method)
    })
  })
})

describe('MyPojoType', () => {
  let MyPojoType
  beforeEach(() => {
    MyPojoType = Extensions[Define]({ })
  })

  describe('with method', () => {
    let method
    beforeEach(() => {
      method = function() { }
      MyPojoType.prototype.method = method
    })

    describe('meged with myType', () => {
      let myType
      beforeEach(() => {
        myType = class { }
        extend(myType, MyPojoType)
      })

      it('should have the method on type', () => {
        expect(myType.prototype.method).toBe(method)
      })
      it('should have no hosts for the method', () => {
        const lookup = [...PartialReflect.hosts(myType, 'method')]
        expect(lookup).toHaveLength(1)
        expect(lookup[0]).toBe(myType)
      })
      it('should have no declarations', () => {
        const declarations = [...partialTypes(myType)]
        expect(declarations).toHaveLength(0)
      })
      it('should have method as member name or symbol', () => {
        const keys = [...Es6UserReflect.keys(myType).filter(isKey)]
        expect(keys).toContain('method')
      })
    })
  })
})

describe('PartialClass', () => {
  let ExtensionSymbol = Symbol('ExtensionSymbol')
  let DefinesSymbol = Symbol('DefinesSymbol')
  let PartialClass
  
  beforeEach(() => {
    PartialClass = class PartialClass extends PartialType { 
      static [Declarations] = { 
        [ExtensionSymbol]: { 
          expectedType: Extensions,
        },
        [DefinesSymbol]: {
          expectedType: PartialClass,
        },
      }
    }
  })

  it('should not be recognized as a partial class', () => {
    expect(PartialReflect.isExtensionOf(
      PartialClass, PartialType, { minDepth: 2 })).toBe(false)
  })
  it('should return null for its partial class', () => {
    expect(getPartialType(PartialClass)).toBe(null)
  })

  describe('MyNamelessExtension', () => {
    let MyNamelessExtension
    beforeEach(() => {
      [MyNamelessExtension] = [class extends PartialClass { }]
    })
    it('should not throw when verified as a PartialType', () => {
      expect(() => { getPartialType(MyNamelessExtension)
      }).not.toThrow()
    })
  })

  describe('MyExtension', () => {
    let MyExtension 
  
    beforeEach(() => {
      MyExtension = class extends PartialClass { }
    })

    it('should be recognized as partial classes', () => {
      expect(PartialReflect.isExtensionOf(
      MyExtension, PartialType, { minDepth: 2 })).toBe(true)
    })
    it('should return PartialClass as their partial class', () => {
      expect(getPartialType(MyExtension)).toBe(PartialClass)
    })
    it('should have no declarations', () => {
      const declarations = [...partialTypes(MyExtension)]
      expect(declarations).toHaveLength(0)
    })
    it('should have no own member names or symbols', () => {
      const keys = [...PartialReflect.ownKeys(MyExtension)]
      expect(keys).toHaveLength(0)
    })
    it('should have no member names or symbols', () => {
      const keys = [...PartialReflect.keys(MyExtension).filter(isKey)]
      expect(keys).toHaveLength(0)
    })
    it('should return null for missing member descriptor', () => {
      let descriptor = null
      for (const current of PartialReflect.getDescriptor(
        MyExtension, 'missingMember')) {
          switch (typeof current) {
            case 'function': /*owner = current*/ break
            case 'object': descriptor = current; break
            default: assert(false, `Unexpected type: ${typeof current}`)
          }
      }
      expect(descriptor).toBe(null)
    })

    describe('with an abstract method', () => {
      beforeEach(() => {
        MyExtension.prototype.method = abstract
      })

      describe('defined on type with a method', () => {
        let method
        let type
        beforeEach(() => {
          type = class { }
          method = function() { }
          type.prototype.method = method
          extend(type, MyExtension)
        })

        it('should have have the concrete method on type', () => {
          expect(type.prototype.method).toBe(method)
        })
      })
    })

    describe('with MyAnonymousSubExtension', () => {
      let MyAnonymousSubExtension
      beforeEach(() => {
        MyAnonymousSubExtension = Extensions[Define]({ })
        MyExtension[ExtensionSymbol] = [ MyAnonymousSubExtension ]
      })

      describe('with method', () => {
        let method
        beforeEach(() => {
          method = function() { }
          MyAnonymousSubExtension.prototype.method = method
        })
        it('should have a descriptor for method', () => {
          let descriptor = null
          for (const current of PartialReflect.getDescriptor(MyExtension, 'method')) {
            switch (typeof current) {
              case 'function': /*owner = current*/ break
              case 'object': descriptor = current; break
              default: assert(false, `Unexpected type: ${typeof current}`)
            }
          }
          expect(descriptor.value).toBe(method)
        })
        
        describe('defined on myType', () => {
          let myType
          beforeEach(() => {
            myType = class { }
            extend(myType, MyExtension)
          })
  
          it('should have method as own member name or symbol', () => {
            const keys = 
              [...PartialReflect.ownKeys(MyExtension)]
            expect(keys).toContain('method')
          })

          it('should not have anonymous declarations', () => {
            const declarations = 
              [...partialTypes(myType)]
            expect(declarations).toEqual([MyExtension])
          })
        })
      })
    })

    describe('with MySubExtension', () => {
      let MySubExtension
    
      beforeEach(() => {
        MySubExtension = class extends PartialClass { }
        MyExtension[DefinesSymbol] = [ MySubExtension ]
      })

      it('should have MySubExtension a declaration', () => {
        const declarations = [...partialTypes(MyExtension)]
        expect(declarations).toEqual([ MySubExtension ])
      })

      describe('with mySubExtensionMethod', () => {
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
          })

          describe('myExtension', () => {
            it('should have method as ownMemberKey', () => {
              const keys = [
                ...PartialReflect.ownKeys(MyExtension)]
              expect(keys).toContain('method')
            })
            it('should have mySubExtension a declaration', () => {
              const declarations = 
                [...partialTypes(MyExtension)]
              expect(declarations).toEqual([ MySubExtension ])
            })
            it('should have method as memberKey', () => {
              const keys = 
                [...PartialReflect.keys(MyExtension).filter(isKey)]
              expect(keys).toContain('method')
            })
            it('should have mySubExtension as declaration', () => {
              const declarations = 
                [...partialTypes(MyExtension)]
              expect(declarations).toEqual([ MySubExtension ])
            })

            describe('when subMethod added to mySubExtension', () => {
              let subMethod
              beforeEach(() => {
                subMethod = function() { }
                MySubExtension.prototype.subMethod = subMethod
              })
              it('should have method as own memberKeys', () => {
                const keys = 
                  [...PartialReflect.ownKeys(MyExtension)]
                expect(keys).toContain('method')
                expect(keys).toHaveLength(1)
              })
              it('should have method and subMethod as memberKeys', () => {
                const keys = 
                  [...PartialReflect.keys(MyExtension).filter(isKey)]
                expect(keys).toContain('method')
                expect(keys).toContain('subMethod')
                expect(keys).toHaveLength(2)
              })

              describe('with MySubSubExtension', () => {
                let MySubSubExtension

                beforeEach(() => {
                  MySubSubExtension = class extends PartialClass { }
                  MySubExtension[DefinesSymbol] = [ MySubSubExtension ]
                })

                it('should have MySubExtension and MySubSubExtension as declarations', () => {
                  const actual = new Set(partialTypes(MyExtension))
                  const expected = new Set([ MySubExtension, MySubSubExtension ])
                  expect(actual).toEqual(expected)
                })
                it('should have MySubSubExtension and MySubExtension a declaration', () => {
                  const declarations = 
                    [...partialTypes(MyExtension)]
                  expect(declarations).toEqual([ 
                    MySubExtension,
                    MySubSubExtension
                  ])
                })

                describe('when subSubMethod added to MySubSubExtension', () => {
                  let subSubMethod
                  beforeEach(() => {
                    subSubMethod = function() { }
                    MySubSubExtension.prototype.subSubMethod = subSubMethod
                  })
                  it('should have method, subMethod, and subSubMethod as memberKeys', () => {
                    const keys = [...PartialReflect.keys(MyExtension).filter(isKey)]
                    expect(keys).toContain('method')
                    expect(keys).toContain('subMethod')
                    expect(keys).toContain('subSubMethod')
                    expect(keys).toHaveLength(3)
                  })
                })
              })
            })
          })
      
          describe('after defining on myType', () => {
            beforeEach(() => {
              extend(myType, MyExtension)
            })

            describe('method', () => {
              it('should apply myExtensionMethod', () => {
                expect(myType.prototype.method).toBe(myExtensionMethod)
                // not mySubExtensionMethod
                expect(myType.prototype.method).not.toBe(mySubExtensionMethod)
              })
            })
            describe('and extending MySubType', () => {
              let mySubType
              beforeEach(() => {
                mySubType = class extends myType { }
              })
              it('should have no declarations', () => {
                const declarations = 
                  [...partialTypes(mySubType)]
                expect(declarations).toHaveLength(2)
                expect(declarations).toContain(MyExtension)
                expect(declarations).toContain(MySubExtension)
              })
              it('should have MyExtension and MySubExtension as declarations', () => {
                const actual = new Set(partialTypes(mySubType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have no ownMemberKeys', () => {
                const keys = 
                  [...Es6UserReflect.ownKeys(mySubType)]
                expect(keys).toHaveLength(0)
              })
              it('should have method as member name or symbol', () => {
                const keys = [...Es6UserReflect.keys(mySubType).filter(isKey)]
                expect(keys).toContain('method')
              })
            })
            describe('myType', () => {
              it('should have MyExtension and MySubExtension as declarations', () => {
                const actual = new Set(partialTypes(myType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have method as own member name or symbol', () => {
                const keys = [...Es6UserReflect.ownKeys(myType)]
                expect(keys).toContain('method')
                expect(keys).toHaveLength(1)
              })
              it('should have method as member name or symbol', () => {
                const keys = [...Es6UserReflect.keys(myType).filter(isKey)]
                expect(keys).toContain('method')
                expect(keys).toHaveLength(1)
              })
            })
          })
        })
      
        describe('with kitchen sink callbacks', () => { 
          let compileCalled
      
          beforeEach(() => {
            compileCalled = false
      
            PartialClass[Compile] = function(descriptor) {
              if (!compileCalled) {
                compileCalled = true
                expect(descriptor.value).toBe(mySubExtensionMethod)
              }
        
              expect(descriptor.enumerable).toBe(true)
              descriptor.enumerable = false
              return descriptor 
            }
        
            extend(myType, MyExtension)
          })
          it('should have the method', () => {
            expect(myType.prototype.method).toBe(mySubExtensionMethod)
          })
          it('should call all PartialType callbacks', () => {
            expect(compileCalled).toBe(true)
          })
        })
      })

      describe('with an abstract method', () => {
        beforeEach(() => {
          MySubExtension.prototype.method = abstract
        })

        describe('defined on type with a method', () => {
          let method
          let type
          beforeEach(() => {
            type = class { }
            method = function() { }
            type.prototype.method = method
            extend(type, MyExtension)
          })
          
          it('should have have the concrete method on type', () => {
            expect(type.prototype.method).toBe(method)
          })
        })
      })
    })
  })
})