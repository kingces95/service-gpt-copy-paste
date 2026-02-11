import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialType } from '@kingjs/partial-type'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'
import { Concept, Implements, ConceptReflect } from '@kingjs/concept'
import { abstract } from '@kingjs/abstract'
import { InfoReflect } from '@kingjs/info-reflect'

describe('Concept', () => {
  it('should compile function descriptor to abstract', () => {
    const Compile = PartialType.Compile
    const descriptor = {
      value: () => { }
    }
    const compiled = Concept[Compile](descriptor)
    expect(compiled.value).toBe(abstract)
  })
  it('should compile getter descriptor to abstract', () => {
    const Compile = PartialType.Compile
    const descriptor = {
      get: () => { }
    }
    const compiled = Concept[Compile](descriptor)
    expect(compiled.get).toBe(abstract)
  })
  it('should compile setter descriptor to abstract', () => {
    const Compile = PartialType.Compile
    const descriptor = {
      set: (value) => { }
    }
    const compiled = Concept[Compile](descriptor)
    expect(compiled.set).toBe(abstract)
  })
})

describe('MyConcept', () => {
  let MyConcept
  beforeEach(() => {
    MyConcept = class MyConcept extends Concept { }
  })
  it('should be a concept', () => {
    expect(ConceptReflect.isConcept(MyConcept)).toBe(true)
  })
  it('should have no own concepts', () => {
    const actual = [...PartialReflect.ownPartialTypes(MyConcept)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('should have not inherited concepts', () => {
    const actual = [...PartialReflect.partialExtensions(MyConcept)]
    const expected = [ ]
    expect(actual).toEqual(expected)
  })
  it('should have no associated concepts', () => {
    const actual = ConceptReflect.associatedConcepts(MyConcept)
    const expected = [ ]
    expect([...actual]).toEqual(expected)
  })
  it('should have no own associated concepts', () => {
    const actual = ConceptReflect.ownAssociatedConcepts(MyConcept)
    expect([...actual]).toEqual([])
  })
  it('should be found on an empty object', () => {
    expect({ }).toBeInstanceOf(MyConcept)
  })
  it('should not be found on an empty class', () => {
    expect(class { }).not.toBeInstanceOf(MyConcept)
  })
  it('should throw testing instanceof against null', () => {
    expect(null).not.toBeInstanceOf(MyConcept)
  })
  describe('with a member', () => {
    beforeEach(() => {
      MyConcept.prototype.member = abstract
    })
    it('should have prototype that is instance of itself', () => {
      expect(MyConcept.prototype).toBeInstanceOf(MyConcept)
    })
    it('should have MySubConcept', () => {
      const actual = [...InfoReflect.getConceptHosts(MyConcept, 'member')]
      const expected = [ MyConcept ]
      expect(actual).toEqual(expected)
    })
    it('should report MyConcept as host for the member', () => {
      const host = PartialReflect.getHost(MyConcept, 'member')
      expect(host).toBe(MyConcept)
    })
    it('should be found on an object with the member', () => {
      expect({ member() { } }).toBeInstanceOf(MyConcept)
    })
    it('should not be found on an object without the member', () => {
      expect({ }).not.toBeInstanceOf(MyConcept)
    })
  })
  describe('with a getter named value', () => {
    beforeEach(() => {
      Object.defineProperty(MyConcept.prototype, 'value', {
        get: abstract,
      })
    })
    it('should have prototype that is instance of itself', () => {
      expect(MyConcept.prototype).toBeInstanceOf(MyConcept)
    })
    it('should be found on an object with the getter', () => {
      expect({ get value() { } }).toBeInstanceOf(MyConcept)
    })
    it('should not be found on an object without the getter', () => {
      expect({ }).not.toBeInstanceOf(MyConcept)
    })
    it('should not be found on an object with just a setter', () => {
      expect({ set value(value) { } }).not.toBeInstanceOf(MyConcept)
    })
  })

  describe('with MySubConcept and PartialClass', () => {
    let MySubConcept
    let MyPartialClass
    beforeEach(() => {
      MyPartialClass = class MyPartialClass extends PartialClass { }
      MyConcept[Extends] = [ MyPartialClass ]

      MySubConcept = class MySubConcept extends Concept { }
      MyConcept[Implements] = [ MySubConcept ]
    })
    it('should have inherited concepts', () => {
      const actual = [...InfoReflect.concepts(MyConcept)]
      const expected = [ MySubConcept ]
      expect(actual).toEqual(expected)
    })
    it('should have own concepts', () => {
      const actual = [...InfoReflect.ownConcepts(MyConcept)]
      const expected = [ MySubConcept ]
      expect(actual).toEqual(expected)
    })
    it('should have prototype that is instance of itself', () => {
      expect(MyConcept.prototype).toBeInstanceOf(MyConcept)
    })

    describe('with an associated concept', () => {
      let AssociatedConcept
      beforeEach(() => {
        AssociatedConcept = class AssociatedConcept extends Concept { 
          associatedMethod() { }
        }
        MyConcept.associatedType = AssociatedConcept
        MyConcept.notAssociatedType = class { }
        MyConcept.justAStatic = 42
      })
      it('should have prototype that is instance of itself', () => {
        expect(MyConcept.prototype).toBeInstanceOf(MyConcept)
      })
      it('should have associated concept', () => {
        const actual = [...ConceptReflect.associatedConcepts(MyConcept)]
        const expected = [ 'associatedType', AssociatedConcept ]
        expect(actual).toEqual(expected)
      })
      it('should have own associated concept', () => {
        const actual = [...ConceptReflect.ownAssociatedConcepts(MyConcept)]
        const expected = [ 'associatedType', AssociatedConcept ]
        expect(actual).toEqual(expected)
      })
      it('should not be found on an empty object', () => {
        expect({ }).not.toBeInstanceOf(MyConcept)
      })
      it('should not be found on a class with bad associated type', () => {
        class MyType {
          static associatedType = 42
        }
        expect(MyType.prototype).not.toBeInstanceOf(MyConcept)
      })
      it('should not be found on class with wrong associated type', () => { 
        class MyType {
          static associatedType = class { }
        }
        expect(MyType.prototype).not.toBeInstanceOf(MyConcept)
      })
      it('should be found on a class with associated type', () => {
        class MyType {
          static get associatedType() { return AssociatedConcept }
        }
        expect(MyType.prototype).toBeInstanceOf(MyConcept)
      })
    })
  })
})
