import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { 
  Concept, 
  ConceptReflect,
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
