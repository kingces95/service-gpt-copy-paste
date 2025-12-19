import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { implement } from '@kingjs/implement'
import { Concept } from '@kingjs/concept'
import { Info } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"
import util from 'util'

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
    const pojo = await clsInfo.toPojo({
      filter: { isNonPublic: false, isKnown: false },
    })  

    // log to infinite depth for easier debugging
    console.log(util.inspect(pojo, { depth: null }))
    
    expect(pojo).toEqual({
      base: 'Object',
      isAnonymous: true,
      members: {
        conceptual: {
          MyConcept: {
            methods: { 
              method: { type: 'method', isAbstract: true } },
            accessors: {
              getter: { 
                type: 'accessor', 
                hasGetter: true, 
                isAbstract: true },
              setter: { 
                type: 'accessor', 
                hasSetter: true, 
                isAbstract: true },
              accessor: {
                type: 'accessor',
                hasGetter: true,
                hasSetter: true,
                isAbstract: true }
            }
          }
        }
      }
    })
  })
})