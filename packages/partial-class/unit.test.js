import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { 
  PartialClass, 
  PartialClassReflect,
  AnonymousPartialClass,
  OwnDeclarationSymbols,
  Compile,
} from '@kingjs/partial-class'

describe('PartialClass', () => {
  it('cannot be instantiated', () => {
    expect(() => new PartialClass()).toThrow()
  })
  it('cannot be the target of mergeMembers', () => {
    expect(() => PartialClassReflect.mergeMembers(PartialClass)).toThrow(
      `Expected type to not be a PartialClass.`)
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
  it('should throw if verified as a PartialClass', () => {
    expect(() => {
      PartialClassReflect.verifyPartialClass(type)
    }).toThrow(`Partial class must indirectly extend PartialClass.`)
  })

  describe('after merging a method', () => {
    let method
    beforeEach(() => {
      method = function method() { }
      PartialClassReflect.mergeMembers(type, 
        AnonymousPartialClass.create({ method }))
    })

    it('should have the method', () => {
      expect(type.prototype.method).toBe(method)
    })
  })

  describe('with a method', () => {
    let method
    let methodResult
    beforeEach(() => {
      method = function method() { }
      methodResult = 
        PartialClassReflect.defineMember(type, 'method', { value: method })
    })

    it('should return method as own descriptor', () => {
      const descriptor = 
        PartialClassReflect.getOwnMemberDescriptor(type, 'method')
      expect(descriptor.value).toBe(method)
      expect(methodResult).toBe(true)
    })

    describe('after attempting to define as abstract method', () => {
      let abstractResult
      beforeEach(() => {
        abstractResult = 
          PartialClassReflect.defineMember(type, 'method', { value: abstract })
      })

      it('should not change the method', () => {
        expect(type.prototype.method).toBe(method)
        expect(abstractResult).toBe(false)
      })
    })
  })
})

describe('MyAnonymousExtension', () => {
  let MyAnonymousExtension
  beforeEach(() => {
    MyAnonymousExtension = AnonymousPartialClass.create({ })
  })

  describe('with method', () => {
    let method
    beforeEach(() => {
      method = function() { }
      MyAnonymousExtension.prototype.method = method
    })

    describe('defined on myType', () => {
      let myType
      beforeEach(() => {
        myType = class { }
        PartialClassReflect.mergeMembers(myType, MyAnonymousExtension)
      })

      it('should have the method on type', () => {
        expect(myType.prototype.method).toBe(method)
      })
      it('should have myType as the host of the method', () => {
        const host = PartialClassReflect.getMemberHost(myType, 'method')
        expect(host).toBe(myType)
      })
      it('should have myType as the only host for the method', () => {
        const lookup = [...PartialClassReflect.memberHosts(myType, 'method')]
        expect(lookup).toContain(myType)
        expect(lookup).toHaveLength(1)
      })
      it('should have no own declarations', () => {
        const declarations = [...PartialClassReflect.ownDeclarations(myType)]
        expect(declarations).toHaveLength(0)
      })
      it('should have method as member name or symbol', () => {
        const namesAndSymbols = [...PartialClassReflect.memberKeys(myType)]
        expect(namesAndSymbols).toContain('method')
      })
    })
  })
})

describe('Extension', () => {
  let ExtensionSymbol = Symbol('ExtensionSymbol')
  let Extension
  
  beforeEach(() => {
    Extension = class Extension extends PartialClass { 
      static [OwnDeclarationSymbols] = { 
        [ExtensionSymbol]: { 
          expectedType: [Extension, AnonymousPartialClass] 
        } 
      }
    }
  })

  it('should not be recognized as a partial class', () => {
    expect(PartialClassReflect.isPartialClass(Extension)).toBe(false)
  })
  it('should return null for its partial class', () => {
    expect(PartialClassReflect.getPartialClass(Extension)).toBe(null)
  })

  describe('MyNamelessExtension', () => {
    let MyNamelessExtension
    beforeEach(() => {
      [MyNamelessExtension] = [class extends Extension { }]
    })
    it('should throw when verified as a PartialClass', () => {
      expect(() => {
        PartialClassReflect.verifyPartialClass(MyNamelessExtension)
      }).toThrow(`PartialClass must have a name.`)
    })
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
    it('should have no own member names or symbols', () => {
      const namesAndSymbols = [...PartialClassReflect.ownMemberKeys(MyExtension)]
      expect(namesAndSymbols).toHaveLength(0)
    })
    it('should have no member names or symbols', () => {
      const namesAndSymbols = [...PartialClassReflect.memberKeys(MyExtension)]
      expect(namesAndSymbols).toHaveLength(0)
    })
    it('should return nothing for missing member hosts', () => {
      const lookup = PartialClassReflect.memberHosts(
        MyExtension, 'missingMember')
      expect([...lookup]).toHaveLength(0)
    })
    it('should return null for missing member host', () => {
      const host = PartialClassReflect.getMemberHost(
        MyExtension, 'missingMember')
      expect(host).toBe(null)
    })
    it('should return undefined for missing member descriptor', () => {
      const descriptor = PartialClassReflect.getMemberDescriptor(
        MyExtension, 'missingMember')
      expect(descriptor).toBe(undefined)
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
          PartialClassReflect.mergeMembers(type, MyExtension)
        })

        it('should have have the concrete method on type', () => {
          expect(type.prototype.method).toBe(method)
        })
      })
    })

    describe('with MyAnonymousSubExtension', () => {
      let MyAnonymousSubExtension
      beforeEach(() => {
        MyAnonymousSubExtension = AnonymousPartialClass.create({ })
        MyExtension[ExtensionSymbol] = [ MyAnonymousSubExtension ]
      })

      describe('with method', () => {
        let method
        beforeEach(() => {
          method = function() { }
          MyAnonymousSubExtension.prototype.method = method
        })

        describe('defined on myType', () => {
          let myType
          beforeEach(() => {
            myType = class { }
            PartialClassReflect.mergeMembers(myType, MyExtension)
          })
  
          it('should have method as own member name or symbol', () => {
            const namesAndSymbols = 
              [...PartialClassReflect.ownMemberKeys(MyExtension)]
            expect(namesAndSymbols).toContain('method')
          })
          it('should have a descriptor for method', () => {
            const descriptor = 
              PartialClassReflect.getMemberDescriptor(MyExtension, 'method')
            expect(descriptor.value).toBe(method)
          })
          it('should not have anonymous declarations', () => {
            const declarations = 
              [...PartialClassReflect.declarations(myType)]
            expect(declarations).toEqual([MyExtension])
          })
          it('should have extension as the host of the method', () => {
            const host = PartialClassReflect.getMemberHost(myType, 'method')
            expect(host).toBe(MyExtension)
          })
        })
      })
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
              const namesAndSymbols = [
                ...PartialClassReflect.ownMemberKeys(MyExtension)]
              expect(namesAndSymbols).toContain('method')
            })
            it('should have mySubExtension as own declaration', () => {
              const declarations = 
                [...PartialClassReflect.ownDeclarations(MyExtension)]
              expect(declarations).toEqual([ MySubExtension ])
            })
            it('should have method as memberKey', () => {
              const namesAndSymbols = 
                [...PartialClassReflect.memberKeys(MyExtension)]
              expect(namesAndSymbols).toContain('method')
            })
            it('should have mySubExtension as declaration', () => {
              const declarations = 
                [...PartialClassReflect.declarations(MyExtension)]
              expect(declarations).toEqual([ MySubExtension ])
            })

            describe('when subMethod added to mySubExtension', () => {
              let subMethod
              beforeEach(() => {
                subMethod = function() { }
                MySubExtension.prototype.subMethod = subMethod
              })
              it('should have method as own memberKeys', () => {
                const namesAndSymbols = 
                  [...PartialClassReflect.ownMemberKeys(MyExtension)]
                expect(namesAndSymbols).toContain('method')
                expect(namesAndSymbols).toHaveLength(1)
              })
              it('should have method and subMethod as memberKeys', () => {
                const namesAndSymbols = 
                  [...PartialClassReflect.memberKeys(MyExtension)]
                expect(namesAndSymbols).toContain('method')
                expect(namesAndSymbols).toContain('subMethod')
                expect(namesAndSymbols).toHaveLength(2)
              })

              describe('with MySubSubExtension', () => {
                let MySubSubExtension

                beforeEach(() => {
                  MySubSubExtension = class extends Extension { }
                  MySubExtension[ExtensionSymbol] = [ MySubSubExtension ]
                })

                it('should have MySubExtension and MySubSubExtension as declarations', () => {
                  const actual = new Set(PartialClassReflect.declarations(MyExtension))
                  const expected = new Set([ MySubExtension, MySubSubExtension ])
                  expect(actual).toEqual(expected)
                })
                it('should have MySubExtension as own declaration', () => {
                  const declarations = 
                    [...PartialClassReflect.ownDeclarations(MyExtension)]
                  expect(declarations).toEqual([ MySubExtension ])
                })

                describe('when subSubMethod added to MySubSubExtension', () => {
                  let subSubMethod
                  beforeEach(() => {
                    subSubMethod = function() { }
                    MySubSubExtension.prototype.subSubMethod = subSubMethod
                  })
                  it('should have method, subMethod, and subSubMethod as memberKeys', () => {
                    const namesAndSymbols = 
                      [...PartialClassReflect.memberKeys(MyExtension)]
                    expect(namesAndSymbols).toContain('method')
                    expect(namesAndSymbols).toContain('subMethod')
                    expect(namesAndSymbols).toContain('subSubMethod')
                    expect(namesAndSymbols).toHaveLength(3)
                  })

                  describe('after defining on myType', () => {
                    beforeEach(() => {
                      PartialClassReflect.mergeMembers(myType, MyExtension)
                    })
                    it('should have MySubSubExtension as member host for subSubMethod', () => {
                      const host = 
                        PartialClassReflect.getMemberHost(myType, 'subSubMethod')
                      expect(host).toBe(MySubSubExtension)
                    })
                    it('should have MySubSubExtension as the only member host for subMethod', () => {
                      const lookup = 
                        [...PartialClassReflect.memberHosts(myType, 'subSubMethod')]
                      expect(lookup).toEqual([ MySubSubExtension ])
                    })
                  })
                })
              })

              describe('after defining on myType', () => {
                beforeEach(() => {
                  PartialClassReflect.mergeMembers(myType, MyExtension)
                })

                it('should have MySubExtension as member host for subMethod', () => {
                  const host = 
                    PartialClassReflect.getMemberHost(myType, 'subMethod')
                  expect(host).toBe(MySubExtension)
                })
                it('should have MySubExtension as the only member host for subMethod', () => {
                  const lookup = 
                    [...PartialClassReflect.memberHosts(myType, 'subMethod')]
                  expect(lookup).toEqual([ MySubExtension ])
                })
              })
            })
          })
      
          describe('after defining on myType', () => {
            beforeEach(() => {
              PartialClassReflect.mergeMembers(myType, MyExtension)
            })

            describe('method', () => {
              it('should apply myExtensionMethod', () => {
                expect(myType.prototype.method).toBe(myExtensionMethod)
                // not mySubExtensionMethod
                expect(myType.prototype.method).not.toBe(mySubExtensionMethod)
              })
              it('should have host of MyExtension', () => {
                const host = PartialClassReflect.getMemberHost(myType, 'method')
                expect(host).toBe(MyExtension)
              })
              it('should have MyExtension and MySubExtension as hosts', () => {
                const actual = new Set(
                  PartialClassReflect.memberHosts(myType, 'method'))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
            })
            describe('and extending MySubType', () => {
              let mySubType
              beforeEach(() => {
                mySubType = class extends myType { }
              })
              it('should have no own declarations', () => {
                const declarations = 
                  [...PartialClassReflect.ownDeclarations(mySubType)]
                expect(declarations).toHaveLength(0)
              })
              it('should have MyExtension and MySubExtension as declarations', () => {
                const actual = new Set(PartialClassReflect.declarations(mySubType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have no ownMemberKeys', () => {
                const namesAndSymbols = 
                  [...PartialClassReflect.ownMemberKeys(mySubType)]
                expect(namesAndSymbols).toHaveLength(0)
              })
              it('should have method as member name or symbol', () => {
                const namesAndSymbols = [...PartialClassReflect.memberKeys(mySubType)]
                expect(namesAndSymbols).toContain('method')
              })
            })
            describe('myType', () => {
              it('should have MyExtension and MySubExtension as own declarations', () => {
                const actual = new Set(PartialClassReflect.ownDeclarations(myType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have MyExtension and MySubExtension as declarations', () => {
                const actual = new Set(PartialClassReflect.declarations(myType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have method as own member name or symbol', () => {
                const namesAndSymbols = [...PartialClassReflect.ownMemberKeys(myType)]
                expect(namesAndSymbols).toContain('method')
                expect(namesAndSymbols).toHaveLength(1)
              })
              it('should have method as member name or symbol', () => {
                const namesAndSymbols = [...PartialClassReflect.memberKeys(myType)]
                expect(namesAndSymbols).toContain('method')
                expect(namesAndSymbols).toHaveLength(1)
              })
            })
          })
        })
      
        describe('with kitchen sink callbacks', () => { 
          let compileCalled
      
          beforeEach(() => {
            compileCalled = false
      
            Extension[Compile] = function(descriptor) {
              if (!compileCalled) {
                compileCalled = true
                expect(descriptor.value).toBe(mySubExtensionMethod)
              }
        
              expect(descriptor.enumerable).toBe(true)
              descriptor.enumerable = false
              return descriptor 
            }
        
            PartialClassReflect.mergeMembers(myType, MyExtension)
          })
          it('should have the method', () => {
            expect(myType.prototype.method).toBe(mySubExtensionMethod)
          })
          it('should call all PartialClass callbacks', () => {
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
            PartialClassReflect.mergeMembers(type, MyExtension)
          })
          
          it('should have have the concrete method on type', () => {
            expect(type.prototype.method).toBe(method)
          })
        })
      })
    })
  })
})