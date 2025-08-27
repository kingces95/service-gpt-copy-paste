import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { implement, Concept } from '@kingjs/concept'
import { get, set, value } from "@kingjs/abstract"
import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"

function filter(pojo) {
  return filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
      isSatisfaction: false, // exclude Concept members
    },
    includeStatic: {
      isInherited: true,
    },
    // select many members for each satisfaction and tag each member
    // with it's the concept is satisfies (useful for pivoting).
    includeConcepts: true,
  })
}

describe('A kitchen sink definition', () => {
  describe.each([
    ['class', class extends Concept {
      get getter() { }
      set setter(value) { }
      get accessor() { }
      set accessor(value) { }
      method() { }
    }],
    ['concise', {
      getter: { get },
      setter: { set },
      accessor: { get, set },
      method: { value },
    }]
  ])('defined using %s syntax', (_, concept) => {
    let cls
    beforeEach(() => {
      [cls] = [class { }]
      implement(cls, concept)
    })
    it('should be instance of the concept', () => {
      concept = typeof concept == 'function' ? 
        concept : Concept.fromPojo(concept)
      expect(cls.prototype).toBeInstanceOf(concept)
    })
    it('should have and info pojo', async () => {
      const pojo = filter(await Info.from(cls).__toPojo())
      expect(pojo).toEqual({
        members: { instance: { 
          accessors: {
            getter: { type: 'accessor', 
              hasGetter: true, isAbstract: true },
            setter: { type: 'accessor', 
              hasSetter: true, isAbstract: true },
            accessor: { type: 'accessor', 
              hasGetter: true, hasSetter: true, isAbstract: true },
          },
          methods: {
            method: { type: 'method', 
              isAbstract: true },
          }
        } },
        base: 'Object',
      })
    })
  })
})