import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept } from '@kingjs/partial-concept'
import { implement } from '@kingjs/partial-implement'
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
    const actual = [...PartialReflect.baseTypes(type)]
      .filter(current => PartialReflect.isExtensionOf(current, Concept))
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
      implement(type, MyConcept)
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
        Object.defineProperty(extendedConcept.prototype, 'method', {
          value: extendedMethodFn,
          configurable: true,
          writable: true,
          enumerable: false,
        })
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
      it('should be a declared concept', () => {
        const actual = [...PartialReflect.baseTypes(type)]
          .filter(current => PartialReflect.isExtensionOf(current, Concept))
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
          'Only function descriptors can be abstractified.'
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
        expect(type.prototype instanceof MyConcept).toBe(false)
      })
      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(type.prototype instanceof MyConcept).toBe(true)
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
          it('will throw noting extension cannot be duck cast', () => {
            // expect(type.prototype instanceof MyConcept).toBe(true)
            expect(() => type.prototype instanceof MyConcept).toThrow(
              'Instance composed of but cannot be duck cast to MyConcept')
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
          it('will throw noting extension cannot be duck cast', () => {
            // expect(type.prototype instanceof MyConcept).toBe(true)
            expect(() => type.prototype instanceof MyConcept).toThrow(
              'Instance composed of but cannot be duck cast to MyConcept')
          })
        })
      })
    })
    describe('with a method', () => {
      beforeEach(() => {
        // MyConcept.prototype.method = abstract
        Object.defineProperty(MyConcept.prototype, 'method', {
          value: abstract,
          configurable: true,
          writable: true,
          enumerable: false,
        })
      })
      it('should not satisfy the concept', () => {
        expect(type.prototype instanceof MyConcept).toBe(false)
      })

      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(type.prototype instanceof MyConcept).toBe(true)
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
          it('will throw noting extension cannot be duck cast', () => {
            expect(() => type.prototype instanceof MyConcept).toThrow(
              'Instance composed of but cannot be duck cast to MyConcept')
            // expect(type.prototype instanceof MyConcept).toBe(true)
          })
        })
      })
      describe('when implemented with a definition', () => {
        const emptyMethod = () => { }
        beforeEach(() => {
          implement(type, MyConcept, { method: emptyMethod })
        })
        it('should satisfy the concept', () => {
          expect(type.prototype instanceof MyConcept).toBe(true)
        })
        it('should have the defined method', () => {
          expect(type.prototype.method).toBe(emptyMethod)
        })
        it('should be a declared concept', () => {
          const actual = [...PartialReflect.baseTypes(type)]
            .filter(current => PartialReflect.isExtensionOf(current, Concept))
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
        associatedConcept = class AssociatedConcept extends Concept {
          associatedMethod() { }
        }
        MyConcept.tagType = associatedConcept
        // TODO: Find a home for this logic: Es6Define.method maybe?
        // MyConcept.prototype.method = abstract
        Object.defineProperty(MyConcept.prototype, 'method', {
          value: abstract,
          configurable: true,
          writable: true,
          enumerable: false,
        })
      })
      it('should not satisfy the concept', () => {
        expect(type.prototype).not.toBeInstanceOf(MyConcept)
      })
      describe('when implemented with the correct tag', () => {
        beforeEach(() => {
          type.tagType = class { 
            associatedMethod() { }
          }
          implement(type.tagType, associatedConcept)
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

