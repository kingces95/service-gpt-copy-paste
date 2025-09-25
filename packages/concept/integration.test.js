import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { implement, Concept } from '@kingjs/concept'
import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"

function filter(pojo) {
  return filterInfoPojo(pojo)
}

describe('A kitchen sink definition', () => {
  let cls
  let clsInfo
  let MyConcept
  beforeEach(() => {
    [cls] = [class { }]
    MyConcept = class extends Concept {
      get getter() { }
      set setter(value) { }
      get accessor() { }
      set accessor(value) { }
      method() { }
    }
    implement(cls, MyConcept)
    clsInfo = Info.from(cls)
  })
  it('should have an info pojo', async () => {
    const unfilteredPojo = await clsInfo.__toPojo()  
    console.log(unfilteredPojo)
    const pojo = filter(unfilteredPojo)
    expect(pojo).toEqual({
      base: 'Object',
      members: { instance: { conceptual: { MyConcept: {
        accessors: {
          getter: { type: 'accessor', 
            hasGetter: true, 
            isAbstract: true },
          setter: { type: 'accessor', 
            hasSetter: true, 
            isAbstract: true },
          accessor: { type: 'accessor', 
            hasGetter: true, 
            hasSetter: true, 
            isAbstract: true },
        },
        methods: {
          method: { type: 'method', 
            isAbstract: true },
        }
      } } } },
    })
  })
})