import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Concept, ConceptReflect, satisfies, implement } from '@kingjs/concept'
import { abstract } from '@kingjs/abstract'

describe('A type', () => {
  it('not passed to implement should throw', () => {
    expect(() => implement(null, class extends Concept { })).toThrow()
  })
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should have no declared concepts', () => {
    const actual = [...ConceptReflect.ownConcepts(type)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  describe('and a concept', () => {
    let concept
    beforeEach(() => {
      concept = class extends Concept { }
    })
    it('not passed to implement should throw', () => {
      expect(() => implement(type, null)).toThrow()
    })
    it('should satisfy the concept', () => {
      expect(null).not.toBeInstanceOf(concept)
      expect(type.prototype).toBeInstanceOf(concept)
    })
    it('should throw implementing itself', () => {
      expect(() => implement(concept, concept)).toThrow([
        "Assertion failed: Expected type 'concept' not to be a PartialClass."
      ].join(' '))
    })
    describe('already implemented by the type', () => {
      let methodFn
      beforeEach(() => {
        concept.prototype.method = abstract
        methodFn = () => { }
        type.prototype.method = methodFn
      })
      it('should not whack the existing method', () => {
        implement(type, concept)
        expect(type.prototype.method).toBe(methodFn)
      })
      it('should whack the existing method when re-implemented', () => {
        const newMethodFn = () => { }
        implement(type, concept, { method: newMethodFn })
        expect(type.prototype.method).toBe(newMethodFn)
      })
    })
    describe('and a type that extends the concept', () => {
      let extendedConcept
      beforeEach(() => {
        extendedConcept = class ExtendedConcept extends concept { }
      })
      it('should throw when implemented', () => {
        const cls = class { }
        expect(() => implement(cls, extendedConcept)).toThrow([
          'Assertion failed:',
          'Argument type "ExtendedConcept" extend directly from Concept.',
        ].join(' '))
      })
    })
    describe('implmented by the type', () => {
      beforeEach(() => {
        implement(type, concept)
      })
      it('should satisfy the concept', () => {
        implement(type, concept)
        expect(type.prototype).toBeInstanceOf(concept)
      })
      it('should be an own declared concept', () => {
        const actual = [...ConceptReflect.ownConcepts(type)]
        const expected = [concept]
        expect(actual).toEqual(expected)
      })
    })
    describe('with a data property', () => {
      beforeEach(() => {
        concept.prototype.data = 42
      })
      it('should throw when implemented', () => {
        expect(() => {
          implement(type, concept)
        }).toThrow(
          'Concept members cannot be data properties. Use accessor or method instead.'
        )
      })    
    })
    describe('with an accessor', () => {
      beforeEach(() => {
        Object.defineProperty(concept.prototype, 'accessor', {
          get: abstract,
          set: abstract,
          configurable: true,
        })
        const descriptor = Object.getOwnPropertyDescriptor(
          concept.prototype, 'accessor')
        expect(descriptor.get).toBe(abstract)
        expect(descriptor.set).toBe(abstract)
      })
      it('should not satisfy the concept', () => {
        expect(satisfies(type.prototype, concept)).toBe(false)
      })
      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, concept)
        })
        it('should satisfy the concept', () => {
          expect(satisfies(type.prototype, concept)).toBe(true)
        })
        it('should have an abstract accessor', () => {
          const descriptor = Object.getOwnPropertyDescriptor(
            type.prototype, 'accessor')
          expect(descriptor.get).toBe(abstract)
          expect(descriptor.set).toBe(abstract)
        })
        describe('and removes the getter', () => {
          beforeEach(() => {
            Reflect.deleteProperty(type.prototype, 'accessor')
            Object.defineProperty(type.prototype, 'accessor', {
              set: abstract,
              configurable: true,
            })
            const descriptor = Object.getOwnPropertyDescriptor(
              type.prototype, 'accessor')
            expect(descriptor.get).toBe(undefined)
            expect(descriptor.set).toBe(abstract)
          })
          it('should still satisfy the concept', () => {
            expect(satisfies(type.prototype, concept)).toBe(true)
          })
        })
        describe('and removes the setter', () => {
          beforeEach(() => {
            Reflect.deleteProperty(type.prototype, 'accessor')
            Object.defineProperty(type.prototype, 'accessor', {
              get: abstract,
              configurable: true,
            })
            const descriptor = Object.getOwnPropertyDescriptor(
              type.prototype, 'accessor')
            expect(descriptor.get).toBe(abstract)
            expect(descriptor.set).toBe(undefined)
          })
          it('should still satisfy the concept', () => {
            expect(satisfies(type.prototype, concept)).toBe(true)
          })
        })
      })
    })
    describe('with a method', () => {
      beforeEach(() => {
        concept.prototype.method = abstract
      })
      it('should not satisfy the concept', () => {
        expect(satisfies(type, concept)).toBe(false)
      })

      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, concept)
        })
        it('should satisfy the concept', () => {
          expect(satisfies(type.prototype, concept)).toBe(true)
        })
        it('should have an abstract method', () => {
          expect(type.prototype.method).toBe(abstract)
        })
        describe('and the method becomes a getter', () => {
          beforeEach(() => {
            Object.defineProperty(type.prototype, 'method', {
              get: abstract,
            })
          }) 
          it('should still satisfy the concept', () => {
            expect(satisfies(type.prototype, concept)).toBe(true)
            expect(type.prototype instanceof concept).toBe(true)
          })
        })
      })
      describe('when implemented with a definition', () => {
        const emptyMethod = () => { }
        beforeEach(() => {
          implement(type, concept, { method: emptyMethod })
        })
        it('should satisfy the concept', () => {
          expect(satisfies(type.prototype, concept)).toBe(true)
        })
        it('should have the defined method', () => {
          expect(type.prototype.method).toBe(emptyMethod)
        })
        it('should be an own declared concept', () => {
          const actual = [...ConceptReflect.ownConcepts(type)]
          const expected = [concept]
          expect(actual).toEqual(expected)
        })
      })
      describe('when implemented with a definition not matching the concept', () => {
        const emptyMethod = () => { }
        it('should throw', () => {
          expect(() => implement(type, concept, { other: emptyMethod }))
            .toThrow("Concept 'concept' does not define member 'other'.")
        })
      })
    })
    describe('with an associated concept and method', () => {
      let associatedConcept
      beforeEach(() => {
        associatedConcept = class extends Concept {
          associatedMethod() { }
        }
        concept.tagType = associatedConcept
        concept.prototype.method = abstract
      })
      it('should not satisfy the concept', () => {
        expect(type.prototype).not.toBeInstanceOf(concept)
      })
      describe('when implemented with the correct tag', () => {
        beforeEach(() => {
          type.tagType = class { 
            associatedMethod() { }
          }
          implement(type, concept)
        })
        it('should satisfy the concept', () => {
          expect(type.prototype).toBeInstanceOf(concept)
        })
      })
      describe('when implemented with an incorrect tag', () => {
        beforeEach(() => {
          type.tagType = class { }
          type.prototype.method = abstract
        })
        it('should not satisfy the concept', () => {
          expect(type.prototype).not.toBeInstanceOf(concept)
        })
      })
    })
  })
})

