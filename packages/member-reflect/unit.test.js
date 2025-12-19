import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { PartialClass } from '@kingjs/partial-class'
import { MemberReflect } from '@kingjs/member-reflect'
import { 
  MemberCollection, 
  Compile,
} from '@kingjs/member-collection'

describe('MemberCollection', () => {
  it('cannot be instantiated', () => {
    expect(() => new MemberCollection()).toThrow()
  })
  it('cannot be the target of mergeMembers', () => {
    expect(() => MemberReflect.merge(MemberCollection)).toThrow(
      `Expected type to not be a MemberCollection.`)
  })
})

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should yield no own declarations', () => {
    const declarations = [...MemberReflect.ownCollections(type)]
    expect(declarations).toHaveLength(0)
  })
  it('should yield no declarations', () => {
    const declarations = [...MemberReflect.collections(type)]
    expect(declarations).toHaveLength(0)
  })

  describe('after merging a method', () => {
    let method
    beforeEach(() => {
      method = function method() { }
      MemberReflect.merge(type, 
        PartialClass.create({ method }))
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
        MemberReflect.defineProperty(type, 'method', { value: method })
    })

    it('should return method as own descriptor', () => {
      const descriptor = 
        MemberReflect.getOwnDescriptor(type, 'method')
      expect(descriptor.value).toBe(method)
      expect(methodResult).toBe(true)
    })

    describe('after attempting to define as abstract method', () => {
      let abstractResult
      beforeEach(() => {
        abstractResult = 
          MemberReflect.defineProperty(type, 'method', { value: abstract })
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
    MyAnonymousExtension = PartialClass.create({ })
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
        MemberReflect.merge(myType, MyAnonymousExtension)
      })

      it('should have the method on type', () => {
        expect(myType.prototype.method).toBe(method)
      })
      it('should have myType as the host of the method', () => {
        const host = MemberReflect.getHost(myType, 'method')
        expect(host).toBe(myType)
      })
      it('should have myType as the only host for the method', () => {
        const lookup = [...MemberReflect.hosts(myType, 'method')]
        expect(lookup).toContain(myType)
        expect(lookup).toHaveLength(1)
      })
      it('should have no own declarations', () => {
        const declarations = [...MemberReflect.ownCollections(myType)]
        expect(declarations).toHaveLength(0)
      })
      it('should have method as member name or symbol', () => {
        const keys = [...MemberReflect.keys(myType)]
        expect(keys).toContain('method')
      })
    })
  })
})

describe('ExtensionGroup', () => {
  let ExtensionSymbol = Symbol('ExtensionSymbol')
  let ExtensionGroup
  
  beforeEach(() => {
    ExtensionGroup = class ExtensionGroup extends MemberCollection { 
      static [MemberCollection.OwnCollectionSymbols] = { 
        [ExtensionSymbol]: { 
          expectedType: [ExtensionGroup, PartialClass] 
        } 
      }
    }
  })

  it('should not be recognized as a partial class', () => {
    expect(MemberReflect.isCollection(ExtensionGroup)).toBe(false)
  })
  it('should return null for its partial class', () => {
    expect(MemberReflect.getCollectionType(ExtensionGroup)).toBe(null)
  })

  describe('MyNamelessExtension', () => {
    let MyNamelessExtension
    beforeEach(() => {
      [MyNamelessExtension] = [class extends ExtensionGroup { }]
    })
    it('should not throw when verified as a MemberCollection', () => {
      expect(() => {
        MemberReflect.getCollectionType(MyNamelessExtension)
      }).not.toThrow()
    })
  })

  describe('MyExtension', () => {
    let MyExtension 
  
    beforeEach(() => {
      MyExtension = class extends ExtensionGroup { }
    })

    it('should be recognized as partial classes', () => {
      expect(MemberReflect.isCollection(MyExtension)).toBe(true)
    })
    it('should return ExtensionGroup as their partial class', () => {
      expect(MemberReflect.getCollectionType(MyExtension)).toBe(ExtensionGroup)
    })
    it('should have no own declarations', () => {
      const declarations = [...MemberReflect.ownCollections(MyExtension)]
      expect(declarations).toHaveLength(0)
    })
    it('should have no declarations', () => {
      const declarations = [...MemberReflect.collections(MyExtension)]
      expect(declarations).toHaveLength(0)
    })
    it('should have no own member names or symbols', () => {
      const keys = [...MemberReflect.ownKeys(MyExtension)]
      expect(keys).toHaveLength(0)
    })
    it('should have no member names or symbols', () => {
      const keys = [...MemberReflect.keys(MyExtension)]
      expect(keys).toHaveLength(0)
    })
    it('should return nothing for missing member hosts', () => {
      const lookup = MemberReflect.hosts(
        MyExtension, 'missingMember')
      expect([...lookup]).toHaveLength(0)
    })
    it('should return null for missing member host', () => {
      const host = MemberReflect.getHost(
        MyExtension, 'missingMember')
      expect(host).toBe(null)
    })
    it('should return undefined for missing member descriptor', () => {
      const descriptor = MemberReflect.getDescriptor(
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
          MemberReflect.merge(type, MyExtension)
        })

        it('should have have the concrete method on type', () => {
          expect(type.prototype.method).toBe(method)
        })
      })
    })

    describe('with MyAnonymousSubExtension', () => {
      let MyAnonymousSubExtension
      beforeEach(() => {
        MyAnonymousSubExtension = PartialClass.create({ })
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
            MemberReflect.merge(myType, MyExtension)
          })
  
          it('should have method as own member name or symbol', () => {
            const keys = 
              [...MemberReflect.ownKeys(MyExtension)]
            expect(keys).toContain('method')
          })
          it('should have a descriptor for method', () => {
            const descriptor = 
              MemberReflect.getDescriptor(MyExtension, 'method')
            expect(descriptor.value).toBe(method)
          })
          it('should not have anonymous declarations', () => {
            const declarations = 
              [...MemberReflect.collections(myType)]
            expect(declarations).toEqual([MyExtension])
          })
          it('should have extension as the host of the method', () => {
            const host = MemberReflect.getHost(myType, 'method')
            expect(host).toBe(MyExtension)
          })
        })
      })
    })

    describe('with MySubExtension', () => {
      let MySubExtension
    
      beforeEach(() => {
        MySubExtension = class extends ExtensionGroup { }
        MyExtension[ExtensionSymbol] = [ MySubExtension ]
      })

      it('should have MySubExtension as own declaration', () => {
        const declarations = [...MemberReflect.ownCollections(MyExtension)]
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
                ...MemberReflect.ownKeys(MyExtension)]
              expect(keys).toContain('method')
            })
            it('should have mySubExtension as own declaration', () => {
              const declarations = 
                [...MemberReflect.ownCollections(MyExtension)]
              expect(declarations).toEqual([ MySubExtension ])
            })
            it('should have method as memberKey', () => {
              const keys = 
                [...MemberReflect.keys(MyExtension)]
              expect(keys).toContain('method')
            })
            it('should have mySubExtension as declaration', () => {
              const declarations = 
                [...MemberReflect.collections(MyExtension)]
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
                  [...MemberReflect.ownKeys(MyExtension)]
                expect(keys).toContain('method')
                expect(keys).toHaveLength(1)
              })
              it('should have method and subMethod as memberKeys', () => {
                const keys = 
                  [...MemberReflect.keys(MyExtension)]
                expect(keys).toContain('method')
                expect(keys).toContain('subMethod')
                expect(keys).toHaveLength(2)
              })

              describe('with MySubSubExtension', () => {
                let MySubSubExtension

                beforeEach(() => {
                  MySubSubExtension = class extends ExtensionGroup { }
                  MySubExtension[ExtensionSymbol] = [ MySubSubExtension ]
                })

                it('should have MySubExtension and MySubSubExtension as declarations', () => {
                  const actual = new Set(MemberReflect.collections(MyExtension))
                  const expected = new Set([ MySubExtension, MySubSubExtension ])
                  expect(actual).toEqual(expected)
                })
                it('should have MySubExtension as own declaration', () => {
                  const declarations = 
                    [...MemberReflect.ownCollections(MyExtension)]
                  expect(declarations).toEqual([ MySubExtension ])
                })

                describe('when subSubMethod added to MySubSubExtension', () => {
                  let subSubMethod
                  beforeEach(() => {
                    subSubMethod = function() { }
                    MySubSubExtension.prototype.subSubMethod = subSubMethod
                  })
                  it('should have method, subMethod, and subSubMethod as memberKeys', () => {
                    const keys = 
                      [...MemberReflect.keys(MyExtension)]
                    expect(keys).toContain('method')
                    expect(keys).toContain('subMethod')
                    expect(keys).toContain('subSubMethod')
                    expect(keys).toHaveLength(3)
                  })

                  describe('after defining on myType', () => {
                    beforeEach(() => {
                      MemberReflect.merge(myType, MyExtension)
                    })
                    it('should have MySubSubExtension as member host for subSubMethod', () => {
                      const host = 
                        MemberReflect.getHost(myType, 'subSubMethod')
                      expect(host).toBe(MySubSubExtension)
                    })
                    it('should have MySubSubExtension as the only member host for subMethod', () => {
                      const lookup = 
                        [...MemberReflect.hosts(myType, 'subSubMethod')]
                      expect(lookup).toEqual([ MySubSubExtension ])
                    })
                  })
                })
              })

              describe('after defining on myType', () => {
                beforeEach(() => {
                  MemberReflect.merge(myType, MyExtension)
                })

                it('should have MySubExtension as member host for subMethod', () => {
                  const host = 
                    MemberReflect.getHost(myType, 'subMethod')
                  expect(host).toBe(MySubExtension)
                })
                it('should have MySubExtension as the only member host for subMethod', () => {
                  const lookup = 
                    [...MemberReflect.hosts(myType, 'subMethod')]
                  expect(lookup).toEqual([ MySubExtension ])
                })
              })
            })
          })
      
          describe('after defining on myType', () => {
            beforeEach(() => {
              MemberReflect.merge(myType, MyExtension)
            })

            describe('method', () => {
              it('should apply myExtensionMethod', () => {
                expect(myType.prototype.method).toBe(myExtensionMethod)
                // not mySubExtensionMethod
                expect(myType.prototype.method).not.toBe(mySubExtensionMethod)
              })
              it('should have host of MyExtension', () => {
                const host = MemberReflect.getHost(myType, 'method')
                expect(host).toBe(MyExtension)
              })
              it('should have MyExtension and MySubExtension as hosts', () => {
                const actual = new Set(
                  MemberReflect.hosts(myType, 'method'))
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
                  [...MemberReflect.ownCollections(mySubType)]
                expect(declarations).toHaveLength(0)
              })
              it('should have MyExtension and MySubExtension as declarations', () => {
                const actual = new Set(MemberReflect.collections(mySubType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have no ownMemberKeys', () => {
                const keys = 
                  [...MemberReflect.ownKeys(mySubType)]
                expect(keys).toHaveLength(0)
              })
              it('should have method as member name or symbol', () => {
                const keys = [...MemberReflect.keys(mySubType)]
                expect(keys).toContain('method')
              })
            })
            describe('myType', () => {
              it('should have MyExtension and MySubExtension as own declarations', () => {
                const actual = new Set(MemberReflect.ownCollections(myType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have MyExtension and MySubExtension as declarations', () => {
                const actual = new Set(MemberReflect.collections(myType))
                const expected = new Set([ MyExtension, MySubExtension ])
                expect(actual).toEqual(expected)
              })
              it('should have method as own member name or symbol', () => {
                const keys = [...MemberReflect.ownKeys(myType)]
                expect(keys).toContain('method')
                expect(keys).toHaveLength(1)
              })
              it('should have method as member name or symbol', () => {
                const keys = [...MemberReflect.keys(myType)]
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
      
            ExtensionGroup[MemberCollection.Compile] = function(descriptor) {
              if (!compileCalled) {
                compileCalled = true
                expect(descriptor.value).toBe(mySubExtensionMethod)
              }
        
              expect(descriptor.enumerable).toBe(true)
              descriptor.enumerable = false
              return descriptor 
            }
        
            MemberReflect.merge(myType, MyExtension)
          })
          it('should have the method', () => {
            expect(myType.prototype.method).toBe(mySubExtensionMethod)
          })
          it('should call all MemberCollection callbacks', () => {
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
            MemberReflect.merge(type, MyExtension)
          })
          
          it('should have have the concrete method on type', () => {
            expect(type.prototype.method).toBe(method)
          })
        })
      })
    })
  })
})