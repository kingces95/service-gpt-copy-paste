import { Es6Info } from "@kingjs/es6-info"
import { } from "@kingjs/es6-info-to-pojo"
import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { objectPojo } from "./object.pojo.js"
import { functionPojo } from "./function.pojo.js"
import { myClassPojo, MyClass } from "./scratch.test.js"

describe('Object to pojo', () => {
  let pojo
  beforeEach(async () => {
    const objInfo = Es6Info.from(Object)
    pojo = await objInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(objectPojo)
  })
})

describe('Function to pojo', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6Info.from(Function)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(functionPojo)
  })
})

describe('MyClass to pojo', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6Info.from(MyClass)
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
