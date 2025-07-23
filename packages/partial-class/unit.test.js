import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialClass, Bind, Extensions, implement } from '@kingjs/partial-class'

describe('A partial type', () => {
  let partialType
  beforeEach(() => {
    partialType = class extends PartialClass { }
  })

  describe.each([
    ['directly on the type', true],
    ['indirectly via an extension', false],
  ])('when implemented %s', (_, directly) => {
    let partialTypePrototype
    beforeEach(() => {
      partialTypePrototype = directly ? partialType.prototype
        : (partialType[Extensions] = class extends PartialClass { }).prototype
    })

    describe('with a member function', () => {
      let member = function() { return this } 
      beforeEach(() => {
        Object.defineProperty(partialTypePrototype, 'member', {
          value: member,
          enumerable: false,
          configurable: true,
          writable: true,
        })
      })

      describe('when implemented', () => {
        describe('on a class without the member', () => {
          let type
          beforeEach(() => {
            type = class {
              static { implement(this, partialType) }
            }
          })
          describe('the prototype', () => {
            let prototype
            beforeEach(() => {
              prototype = type.prototype
            })

            describe('descriptor for the member', () => {
              let descriptor
              beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(prototype, 'member')
              })

              it('should be defined', () => {
                expect(descriptor).toBeDefined()
              })
              it('should be the member function', () => {
                expect(descriptor.value).toBe(member)
              })
              it('should not be enumerable', () => {
                expect(descriptor.enumerable).toBe(false)
              })
              it('should be configurable', () => {
                expect(descriptor.configurable).toBe(true)
              })
              it('should be writable', () => {
                expect(descriptor.writable).toBe(true)
              })
            })
          })
        })
        describe('on a class with the member', () => {
          let type
          let existingDescriptor
          beforeEach(() => {
            type = class {
              member() { return this }
            }
            existingDescriptor = Object.getOwnPropertyDescriptor(
              type.prototype, 'member')
          })
          
          describe('the prototype', () => {
            let prototype
            beforeEach(() => {
              prototype = type.prototype
            })

            describe('descriptor for the member', () => {
              let descriptor
              beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(prototype, 'member')
              })

              it('should be defined', () => {
                expect(descriptor).toBeDefined()
              })
              it('should be the existing member function', () => {
                expect(descriptor.value).toBe(existingDescriptor.value)
              })
              it('should not be enumerable', () => {
                expect(descriptor.enumerable).toBe(false)
              })
              it('should be configurable', () => {
                expect(descriptor.configurable).toBe(true)
              })
            })
          })
        })
      })
    })

    describe('with a member accessor', () => {
      const getter = function() { return this }
      const setter = function(value) { this.value = value }
      beforeEach(() => {
        Object.defineProperty(partialTypePrototype, 'member', {
          get: getter,
          set: setter,
          enumerable: false,
          configurable: true,
        })
      })

      describe('when implemented', () => {
        describe('on a class without the member', () => {
          let type
          beforeEach(() => {
            type = class {
              static { implement(this, partialType) }
            }
          })

          describe('the prototype', () => {
            let prototype
            beforeEach(() => {
              prototype = type.prototype
            })

            describe('descriptor for the member', () => {
              let descriptor
              beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(prototype, 'member')
              })

              it('should be defined', () => {
                expect(descriptor).toBeDefined()
              })
              it('should have a getter', () => {
                expect(descriptor.get).toBe(getter)
              })
              it('should have a setter', () => {
                expect(descriptor.set).toBe(setter)
              })
              it('should not be enumerable', () => {
                expect(descriptor.enumerable).toBe(false)
              })
              it('should be configurable', () => {
                expect(descriptor.configurable).toBe(true)
              })
            })
          })
        })
        describe('on a class with the member', () => {
          let type
          let existingDescriptor
          beforeEach(() => {
            type = class {
              get member() { return this }
              set member(value) { this.value = value }
            }
            existingDescriptor = Object.getOwnPropertyDescriptor(
              type.prototype, 'member')
          })

          describe('the prototype', () => {
            let prototype
            beforeEach(() => {
              prototype = type.prototype
            })

            describe('descriptor for the member', () => {
              let descriptor
              beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(prototype, 'member')
              })

              it('should be defined', () => {
                expect(descriptor).toBeDefined()
              })
              it('should be the existing getter', () => {
                expect(descriptor.get).toBe(existingDescriptor.get)
              })
              it('should be the existing setter', () => {
                expect(descriptor.set).toBe(existingDescriptor.set)
              })
              it('should not be enumerable', () => {
                expect(descriptor.enumerable).toBe(false)
              })
              it('should be configurable', () => {
                expect(descriptor.configurable).toBe(true)
              })
            })
          })
        })
      })
    })

  })

  describe('as a base class for a class with custom binding', () => {
    const member = function() { return this } 
    let type
    let didBind
    beforeEach(() => {
      didBind = false
      partialType[Bind] = function(type$, partialType$, name, descriptor) {
        expect(type$).toBe(type)
        expect(partialType$).toBe(partialType)
        expect(name).toBe('member')
        expect(descriptor.value).toBe(member)
        didBind = true

        // defaults should be assigned to the descriptor
        return PartialClass[Bind](
          type$, partialType$, name, { value: descriptor.value })
      }
    })

    describe('with a member function', () => {
      beforeEach(() => {
        Object.defineProperty(partialType.prototype, 'member', {
          value: member,
          enumerable: false,
          configurable: true,
          writable: true,
        })
      })
      
      describe('when implemented', () => {
        describe('on a class without the member', () => {
          beforeEach(() => {
            type = class {
              static { 
                type = this
                implement(this, partialType) 
              }
            }
          })
          it('should call the Bind method', () => {
            expect(didBind).toBe(true)
          })
          describe('the prototype', () => {
            let prototype
            beforeEach(() => {
              prototype = type.prototype
            })
  
            describe('descriptor for the member', () => {
              let descriptor
              beforeEach(() => {
                descriptor = Object.getOwnPropertyDescriptor(prototype, 'member')
              })
  
              it('should be defined', () => {
                expect(descriptor).toBeDefined()
              })
              it('should be the member function', () => {
                expect(descriptor.value).toBe(member)
              })
              it('should not be enumerable', () => {
                expect(descriptor.enumerable).toBe(false)
              })
              it('should be configurable', () => {
                expect(descriptor.configurable).toBe(true)
              })
              it('should be writable', () => {
                expect(descriptor.writable).toBe(true)
              })
            })
          })
        })
      })
    })
  })
})
