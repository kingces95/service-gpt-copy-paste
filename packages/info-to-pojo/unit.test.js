import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { PartialObject } from '@kingjs/partial-object'
import { PartialClass } from '@kingjs/partial-class'
import { Concept } from '@kingjs/concept'
import { PartialPojo } from '@kingjs/partial-pojo'

import { Info } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"

import { objectPojo } from "./pojo/object.pojo.js"
import { functionPojo } from "./pojo/function.pojo.js"
import { myClassPojo } from "./pojo/my-class.pojo.js"
import { myConceptPojo } from "./pojo/my-concept.pojo.js"

// import { myClassStaticPojo } from "./pojo/my-class-static.pojo.js"
// import { myClassInstancePojo } from "./pojo/my-class-instance.pojo.js"

import {
  MyBaseConcept,
  MyLeftConcept,
  MyRightConcept,
  MyConcept,
  MyBasePartialClass,
  MyPartialClass,
  MyBase,
  MyEmptyClass,
  MyClass
} from "./my-classes.js"

describe('Object members', () => {
  let pojo
  beforeEach(async () => {
    const objInfo = Info.from(Object)
    pojo = await objInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(objectPojo)
  })
})

describe('Function members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(Function)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(functionPojo)
  })
})

describe('PartialObject members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(PartialObject)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'PartialObject' })
  })
})

describe('PartialClass members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(PartialClass)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'PartialClass', base: 'PartialObject' })
  })
})

describe('Concept members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(Concept)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'Concept', base: 'PartialObject' })
  })
})

describe('PartialPojo members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(PartialPojo)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'PartialPojo', base: 'PartialObject' })
  })
})

describe('MyClass members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(MyClass)
    pojo = await fnInfo.toPojo({
      filter: { 
        isKnown: false,
        isNonPublic: false,
      },
    })
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myClassPojo)
  })
})

describe('MyConcept members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(MyConcept)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myConceptPojo)
  })
})

// describe('MyClass instance members', () => {
//   let pojo
//   beforeEach(async () => {
//     const fnInfo = Es6Info.from(MyClass)
//     pojo = await fnInfo.toPojo({
//       filter: { 
//         isStatic: false,
//         isKnown: false,
//         isNonPublic: false,
//       },
//     })
//   })

//   it('matches expected', () => {
//     expect(pojo).toEqual(myClassInstancePojo)
//   })
// })

// describe('MyClass static members', () => {
//   let pojo
//   beforeEach(async () => {
//     const fnInfo = Es6Info.from(MyClass)
//     pojo = await fnInfo.toPojo({
//       filter: { 
//         isStatic: true,
//         isKnown: false,
//         isNonPublic: false,
//       },
//     })
//   })

//   it('matches expected', () => {
//     expect(pojo).toEqual(myClassStaticPojo)
//   })
// })
