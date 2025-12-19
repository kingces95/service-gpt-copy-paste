import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { 
  Concept, 
  satisfies, 
  implement 
} from '@kingjs/concept'
import { abstract } from '@kingjs/abstract'

describe('MyConcept', () => {
  let MyConcept
  beforeEach(() => {
    MyConcept = class MyConcept extends Concept { }
  })
  it('should have no own concepts', () => {
    const actual = [...PartialReflect.ownCollections(MyConcept)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('should have not inherited concepts', () => {
    const actual = [...PartialReflect.collections(MyConcept)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  describe('with a member', () => {
    beforeEach(() => {
      MyConcept.prototype.member = abstract
    })
    it('should report MyConcept as host for the member', () => {
      const host = PartialReflect.getHost(MyConcept, 'member')
      expect(host).toBe(MyConcept)
    })
  })
})

describe('A type', () => {
  it('not passed to implement should throw', () => {
    expect(() => implement(null, class extends Concept { })).toThrow()
  })
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should have no declared concepts', () => {
    const actual = [...PartialReflect.ownCollections(type)]
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
        "Expected type to not be a PartialObject."
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
      beforeEach(() => {
        extendedConcept = class ExtendedConcept extends MyConcept { }
      })
      it('should throw when implemented', () => {
        const cls = class { }
        expect(() => implement(cls, extendedConcept)).toThrow([
          'Assertion failed: Expected type to indirectly extend PartialObject.',
        ].join(' '))
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
        const actual = [...PartialReflect.ownCollections(type)]
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
          'Concept members cannot be data properties. Use accessor or method instead.'
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
        expect(satisfies(type.prototype, MyConcept)).toBe(false)
      })
      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(satisfies(type.prototype, MyConcept)).toBe(true)
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
            expect(satisfies(type.prototype, MyConcept)).toBe(true)
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
            expect(satisfies(type.prototype, MyConcept)).toBe(true)
          })
        })
      })
    })
    describe('with a method', () => {
      beforeEach(() => {
        MyConcept.prototype.method = abstract
      })
      it('should not satisfy the concept', () => {
        expect(satisfies(type, MyConcept)).toBe(false)
      })

      describe('when implemented', () => {
        beforeEach(() => {
          implement(type, MyConcept)
        })
        it('should satisfy the concept', () => {
          expect(satisfies(type.prototype, MyConcept)).toBe(true)
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
            expect(satisfies(type.prototype, MyConcept)).toBe(true)
            expect(type.prototype instanceof MyConcept).toBe(true)
          })
        })
      })
      describe('when implemented with a definition', () => {
        const emptyMethod = () => { }
        beforeEach(() => {
          implement(type, MyConcept, { method: emptyMethod })
        })
        it('should satisfy the concept', () => {
          expect(satisfies(type.prototype, MyConcept)).toBe(true)
        })
        it('should have the defined method', () => {
          expect(type.prototype.method).toBe(emptyMethod)
        })
        it('should be an own declared concept', () => {
          const actual = [...PartialReflect.ownCollections(type)]
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

