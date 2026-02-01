import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { implement } from '@kingjs/implement'
import { Concept } from '@kingjs/concept'
import { TypeInfo } from "@kingjs/info"
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
    clsInfo = TypeInfo.from(cls)
  })
  it('should have an info pojo', async () => {
    const pojo = await clsInfo.toPojo({
      isNonPublic: false, isKnown: false,
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
              method: { host: '.', isAbstract: true } },
            getters: { 
              getter: { host: '.', isAbstract: true } },
            setters: { 
              setter: { host: '.', isAbstract: true } },
            properties: {
              accessor: { host: '.', isAbstract: true } }
          }
        }
      }
    })
  })
})