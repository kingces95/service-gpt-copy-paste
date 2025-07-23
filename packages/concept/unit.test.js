import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Concept  } from '@kingjs/concept'
import { PartialClass, implement, Extensions, Bind } from '@kingjs/partial-class'

describe('A concept', () => {
  let concept
  beforeEach(() => {
    concept = class extends Concept { }
  })

  describe('with a member function', () => {
    let member = function() { return this } 
    beforeEach(() => {
      concept.prototype.member = member
    })

    describe('when implemented', () => {
      describe('on a class without the member', () => {
        let type
        beforeEach(() => {
          type = class {
            static [Bind](concept, name) { 
              expect(concept).toBe(concept)
              expect(name).toBe('member')
              return member
            }
            static { implement(this, concept) }
          }
        })
        it('should be an instance of the concept', () => {
          expect(type.prototype).toBeInstanceOf(concept)
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
            static [Bind](concept, name) { throw new Error(
              'Should not be called.')
            }
            member() { return this }
          }
          existingDescriptor = Object.getOwnPropertyDescriptor(
            type.prototype, 'member')
        })
        
        it('should be an instance of the concept', () => {
          expect(type.prototype).toBeInstanceOf(concept)
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
      Object.defineProperties(concept.prototype, {
        member: {
          get: getter,
          set: setter,
        }
      })
    })

    describe('when implemented', () => {
      describe('on a class without the member', () => {
        let type
        beforeEach(() => {
          type = class {
            static [Bind](concept, name) { 
              expect(concept).toBe(concept)
              expect(name).toBe('member')
              return { get: getter, set: setter }
            }
            static { implement(this, concept) }
          }
        })

        it('should be an instance of the concept', () => {
          expect(type.prototype).toBeInstanceOf(concept)
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
            static [Bind](concept, name) { throw new Error(
              'Should not be called.')
            }
            get member() { return this }
            set member(value) { this.value = value }
          }
          existingDescriptor = Object.getOwnPropertyDescriptor(
            type.prototype, 'member')
        })

        it('should be an instance of the concept', () => {
          expect(type.prototype).toBeInstanceOf(concept)
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

  describe('with an extension function', () => {
    let extensionDescriptor
    beforeEach(() => {
      concept[Extensions] = class extends PartialClass {
        extension() { return this }
      }
      extensionDescriptor = Object.getOwnPropertyDescriptor(
        concept[Extensions].prototype, 'extension')
    })
    describe('when implemented', () => {
      describe('on a class without the extension', () => {
        let type
        beforeEach(() => {
          type = class {
            static { implement(this, concept) }
          }
        })
  
        describe('the prototype', () => {
          let prototype
          beforeEach(() => {
            prototype = type.prototype
          })

          describe('descriptor for the extension', () => {
            let descriptor
            beforeEach(() => {
              descriptor = Object.getOwnPropertyDescriptor(prototype, 'extension')
            })

            it('should be defined', () => {
              expect(descriptor).toBeDefined()
            })
            it('should have a value', () => {
              expect(descriptor.value).toBe(extensionDescriptor.value)
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
      describe('on a class with the extension', () => {
        let type
        let existingDescriptor
        beforeEach(() => {
          type = class {
            static {
              implement(this, concept)
            }
            extension() { return this }
          }
          existingDescriptor = Object.getOwnPropertyDescriptor(
            type.prototype, 'extension')
        })

        describe('the prototype', () => {
          let prototype
          beforeEach(() => {
            prototype = type.prototype
          })

          describe('descriptor for the extension', () => {
            let descriptor
            beforeEach(() => {
              descriptor = Object.getOwnPropertyDescriptor(
                prototype, 'extension')
            })

            it('should be the existing extension', () => {
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

  describe('with an extension accessor', () => {
    let extensionDescriptor
    beforeEach(() => {
      class extensions extends PartialClass {
        get extension() { return this }
        set extension(value) { this.value = value }
      }
      concept[Extensions] = extensions
      extensionDescriptor = Object.getOwnPropertyDescriptor(
        extensions.prototype, 'extension')
    })
    describe('when implemented', () => {
      describe('on a class without the extension', () => {
        let type
        beforeEach(() => {
          type = class {
            static { implement(this, concept) }
          }
        })

        describe('the prototype', () => {
          let prototype
          beforeEach(() => {
            prototype = type.prototype
          })

          describe('descriptor for the extension', () => {
            let descriptor
            beforeEach(() => {
              descriptor = Object.getOwnPropertyDescriptor(prototype, 'extension')
            })

            it('should be defined', () => {
              expect(descriptor).toBeDefined()
            })
            it('should have a getter', () => {
              expect(descriptor.get).toBe(extensionDescriptor.get)
            })
            it('should have a setter', () => {
              expect(descriptor.set).toBe(extensionDescriptor.set)
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
      describe('on a class with the extension', () => {
        let type
        let existingDescriptor
        beforeEach(() => {
          type = class {
            static { implement(this, concept) }
            get extension() { return this }
            set extension(value) { this.existing = value }
          }
          existingDescriptor = Object.getOwnPropertyDescriptor(
            type.prototype, 'extension')
        })

        describe('the prototype', () => {
          let prototype
          beforeEach(() => {
            prototype = type.prototype
          })

          describe('descriptor for the extension', () => {
            let descriptor
            beforeEach(() => {
              descriptor = Object.getOwnPropertyDescriptor(prototype, 'extension')
            })

            it('should be defined', () => {
              expect(descriptor).toBeDefined()
            })
            it('should be the existing getter', () => {
              expect(descriptor.get).toBe(existingDescriptor.get)
            })
            it('should bet the existing setter', () => {
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
