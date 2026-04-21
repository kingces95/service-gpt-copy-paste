import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { PartialType } from '@kingjs/partial-type'
import { PartialClass } from '@kingjs/partial-class'
import { Concept } from '@kingjs/partial-concept'
import { Attachments } from '@kingjs/partial-attachments'

import { ClassInfo } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"

import { myClassPojo } from "./pojo/my-class.pojo.js"
import { myConceptPojo } from "./pojo/my-concept.pojo.js"
import { myAttachmentsPojo } from "./pojo/my-attachments.pojo.js"

import {
  MyExtensions,
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
import { PartialReflect } from '@kingjs/partial-reflect'

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

describe('Attachments members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(Attachments)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ 
      name: 'Attachments', 
      base: 'PartialType',
      isAbstract: true,
    })
  })
})

describe('MyConcept members', () => {
  let fnInfo
  beforeEach(async () => {
    fnInfo = ClassInfo.from(MyConcept)
  })

  it('has expected concepts for myConceptMethod', () => {
    const methodInfo = fnInfo.getMember('myConceptMethod')
    const concepts = [...methodInfo.concepts()]
    expect(concepts).toEqual([])
  })

  it('matches expected', async () => {
    const pojo = await fnInfo.toPojo()
    expect(pojo).toEqual(myConceptPojo)
  })
})

describe('MyExtensions members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = ClassInfo.from(MyExtensions)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myAttachmentsPojo)
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
