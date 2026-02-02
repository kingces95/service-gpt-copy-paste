import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { PartialType } from '@kingjs/partial-type'
import { PartialClass } from '@kingjs/partial-class'
import { Concept } from '@kingjs/concept'
import { Extensions } from '@kingjs/extensions'

import { ClassInfo } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"

import { myClassPojo } from "./pojo/my-class.pojo.js"
import { myConceptPojo } from "./pojo/my-concept.pojo.js"

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
import { isAbstract } from '@kingjs/abstract'

describe('Object members', () => {
  let pojo
  beforeEach(async () => {
    const objInfo = ClassInfo.from(Object)
    pojo = await objInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'Object' })
  })
})

describe('Function members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(Function)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'Function', base: 'Object' })
  })
})

describe('PartialType members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(PartialType)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ 
      name: 'PartialType',
      isAbstract: true,
    })
  })
})

describe('PartialClass members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(PartialClass)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ 
      name: 'PartialClass', 
      base: 'PartialType',
      isAbstract: true,
    })
  })
})

describe('Concept members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(Concept)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ 
      name: 'Concept', 
      base: 'PartialType',
      isAbstract: true,
    })
  })
})

describe('Extensions members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(Extensions)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ 
      name: 'Extensions', 
      base: 'PartialType',
      isAbstract: true,
    })
  })
})

describe('MyConcept members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(MyConcept)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myConceptPojo)
  })
})

describe('MyClass members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(MyClass)
    pojo = await fnInfo.toPojo({
      isNonPublic: false,
    })
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myClassPojo)
  })
})

// describe('MyClass static members', () => {
//   let pojo
//   beforeEach(async () => {
//     const fnInfo = Es6ClassInfo.from(MyClass)
//     pojo = await fnInfo.toPojo({
//       isStatic: true,
//       isKnown: false,
//       isNonPublic: false,
//     })
//   })

//   it('matches expected', () => {
//     expect(pojo).toEqual(myClassStaticPojo)
//   })
// })
