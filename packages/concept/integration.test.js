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
    // select many members for each satisfaction and tag each member
    // with it's the concept is satisfies (useful for pivoting).
    includeConcepts: true,
  })
}

describe('A kitchen sink definition', () => {
  describe.each([
    ['class', class MyConcept extends Concept {
      get getter() { }
      set setter(value) { }
      get accessor() { }
      set accessor(value) { }
      method() { }
    }],
    // Decided against annonymous concepts
    // ['concise', {
    //   getter: { get },
    //   setter: { set },
    //   accessor: { get, set },
    //   method: { value },
    // }]
  ])('defined using %s syntax', (_, concept) => {
    let cls
    let clsInfo
    beforeEach(() => {
      [cls] = [class { }]
      implement(cls, concept)
      clsInfo = Info.from(cls)
    })
    it('should have an info pojo', async () => {
      const unfilteredPojo = await clsInfo.__toPojo()  
      const pojo = filter(unfilteredPojo)
      expect(pojo).toEqual({
        base: 'Object',
        members: { instance: { conceptual: { MyConcept: {
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
        } } } },
      })
    })
  })
})