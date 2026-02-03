import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept, ConceptReflect } from '@kingjs/concept'
import { implement } from '@kingjs/implement'
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
    const actual = [...PartialReflect.ownPartialExtensions(type)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  describe('and a concept', () => {
    let MyConcept
    beforeEach(() => {
      MyConcept = class MyConcept extends Concept { }
    })
    it('not passed to implement should throw', () => {
      expect(() => implement(type, null)).toThrow()
    })
    it('should satisfy the concept', () => {
      expect(null).not.toBeInstanceOf(MyConcept)
      expect(type.prototype).toBeInstanceOf(MyConcept)
    })
    it('should throw implementing itself', () => {
      expect(() => implement(MyConcept, MyConcept)).toThrow([
        "Expected type to not be a PartialType."
      ].join(' '))
    })
    describe('already implemented by the type', () => {
      let methodFn
      beforeEach(() => {
        MyConcept.prototype.method = function() { }
        methodFn = () => { }
        type.prototype.method = methodFn
      })
      it('should not whack the existing method', () => {
        implement(type, MyConcept)
        expect(type.prototype.method).toBe(methodFn)
      })
      it('should whack the existing method when re-implemented', () => {
        const newMethodFn = () => { }
        implement(type, MyConcept, { method: newMethodFn })
        expect(type.prototype.method).toBe(newMethodFn)
      })
    })
    describe('and a type that extends the concept', () => {
      let extendedConcept
      let extendedMethodFn
      let cls
      beforeEach(() => {
        extendedMethodFn = () => { }
        extendedConcept = class ExtendedConcept extends MyConcept { }
        extendedConcept.prototype.method = extendedMethodFn
        cls = class { }
        implement(cls, extendedConcept)
      })
      it('should satisfy the extended concept', () => {
        expect(cls.prototype).toBeInstanceOf(extendedConcept)
      })
      it('should satisfy MyConcept', () => {
        expect(cls.prototype).toBeInstanceOf(MyConcept)
      })
    })
    describe('implmented by the type', () => {
      beforeEach(() => {
        implement(type, MyConcept)
      })
      it('should satisfy the concept', () => {
        implement(type, MyConcept)
        expect(type.prototype).toBeInstanceOf(MyConcept)
      })
      it('should be an own declared concept', () => {
        const actual = [...PartialReflect.ownPartialExtensions(type)]
        const expected = [MyConcept]
        expect(actual).toEqual(expected)
      })
    })
    describe('with a data property', () => {
      beforeEach(() => {
        MyConcept.prototype.data = 42
      })
      it('should throw when implemented', () => {
        expect(() => {
          implement(type, MyConcept)
        }).toThrow(
          'Concept members must be accessors or methods not field.'
        )
      })    
    })
    describe('with an accessor', () => {
      beforeEach(() => {
        Object.defineProperty(MyConcept.prototype, 'accessor', {
          get: abstract,
          set: abstract,
          configurable: true,
        })
        const descriptor = Object.getOwnPropertyDescriptor(
          MyConcept.prototype, 'accessor')
        expect(descriptor.get).toBe(abstract)
        expect(descriptor.set).toBe(abstract)
      })
      it('should not satisfy the concept', () => {
        expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(false)
      })
      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(true)
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
          it('should not satisfy the concept', () => {
            expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(false)
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
          it('should not satisfy the concept', () => {
            expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(false)
          })
        })
      })
    })
    describe('with a method', () => {
      beforeEach(() => {
        MyConcept.prototype.method = abstract
      })
      it('should not satisfy the concept', () => {
        expect(ConceptReflect.satisfies(type, MyConcept)).toBe(false)
      })

      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(true)
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
          it('should not satisfy the concept', () => {
            expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(false)
            expect(type.prototype instanceof MyConcept).toBe(false)
          })
        })
      })
      describe('when implemented with a definition', () => {
        const emptyMethod = () => { }
        beforeEach(() => {
          implement(type, MyConcept, { method: emptyMethod })
        })
        it('should satisfy the concept', () => {
          expect(ConceptReflect.satisfies(type.prototype, MyConcept)).toBe(true)
        })
        it('should have the defined method', () => {
          expect(type.prototype.method).toBe(emptyMethod)
        })
        it('should be an own declared concept', () => {
          const actual = [...PartialReflect.ownPartialExtensions(type)]
          const expected = [MyConcept]
          expect(actual).toEqual(expected)
        })
      })
      describe('when implemented with a definition not matching the concept', () => {
        const emptyMethod = () => { }
        it('should throw', () => {
          expect(() => implement(type, MyConcept, { other: emptyMethod }))
            .toThrow("Concept 'MyConcept' does not define member 'other'.")
        })
      })
    })
    describe('with an associated concept and method', () => {
      let associatedConcept
      beforeEach(() => {
        associatedConcept = class extends Concept {
          associatedMethod() { }
        }
        MyConcept.tagType = associatedConcept
        MyConcept.prototype.method = abstract
      })
      it('should not satisfy the concept', () => {
        expect(type.prototype).not.toBeInstanceOf(MyConcept)
      })
      describe('when implemented with the correct tag', () => {
        beforeEach(() => {
          type.tagType = class { 
            associatedMethod() { }
          }
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(type.prototype).toBeInstanceOf(MyConcept)
        })
      })
      describe('when implemented with an incorrect tag', () => {
        beforeEach(() => {
          type.tagType = class { }
          type.prototype.method = abstract
        })
        it('should not satisfy the concept', () => {
          expect(type.prototype).not.toBeInstanceOf(MyConcept)
        })
      })
    })
  })
})

