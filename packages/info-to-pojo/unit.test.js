import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { MemberCollection } from '@kingjs/member-collection'
import { ExtensionGroup } from '@kingjs/extension-group'
import { Concept } from '@kingjs/concept'
import { PartialClass } from '@kingjs/partial-class'

import { Info } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"

import { objectPojo } from "./pojo/object.pojo.js"
import { functionPojo } from "./pojo/function.pojo.js"

// import { myClassPojo } from "./pojo/my-class.pojo.js"
// import { myClassStaticPojo } from "./pojo/my-class-static.pojo.js"
// import { myClassInstancePojo } from "./pojo/my-class-instance.pojo.js"

// import { MyClass } from "./dump.test.js"

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

describe('MemberCollection members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(MemberCollection)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'MemberCollection' })
  })
})

describe('ExtensionGroup members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(ExtensionGroup)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'ExtensionGroup', base: 'MemberCollection' })
  })
})

describe('Concept members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(Concept)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'Concept', base: 'MemberCollection' })
  })
})

describe('PartialClass members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Info.from(PartialClass)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'PartialClass', base: 'MemberCollection' })
  })
})


// describe('MyClass members', () => {
//   let pojo
//   beforeEach(async () => {
//     const fnInfo = Es6Info.from(MyClass)
//     pojo = await fnInfo.toPojo({
//       filter: { 
//         isKnown: false,
//         isNonPublic: false,
//       },
//     })
//   })

//   it('matches expected', () => {
//     expect(pojo).toEqual(myClassPojo)
//   })
// })

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
