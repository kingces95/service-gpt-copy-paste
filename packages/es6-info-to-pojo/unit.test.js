import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { Es6ClassInfo } from "@kingjs/es6-info"
import { } from "@kingjs/es6-info-to-pojo"

import { objectPojo } from "./pojo/object.pojo.js"
import { functionPojo } from "./pojo/function.pojo.js"
import { myClassPojo } from "./pojo/my-class.pojo.js"
import { myClassStaticPojo } from "./pojo/my-class-static.pojo.js"
import { myClassInstancePojo } from "./pojo/my-class-instance.pojo.js"
import { myClassOwnPojo } from "./pojo/my-class-own.pojo.js"

import { MyClass } from "./dump.test.js"

describe('Object members', () => {
  let pojo
  beforeEach(async () => {
    const objInfo = Es6ClassInfo.from(Object)
    pojo = await objInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(objectPojo)
  })
})

describe('Unknown object members', () => {
  let pojo
  beforeEach(async () => {
    const objInfo = Es6ClassInfo.from(Object)
    pojo = await objInfo.toPojo({ isKnown: false })
  })

  it('matches expected', () => {
    expect(pojo).toEqual({ name: 'Object' })
  })
})

describe('Function members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6ClassInfo.from(Function)
    pojo = await fnInfo.toPojo()
  })

  it('matches expected', () => {
    expect(pojo).toEqual(functionPojo)
  })
})

describe('MyClass members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6ClassInfo.from(MyClass)
    pojo = await fnInfo.toPojo({
      isKnown: false,
      isNonPublic: false,
    })
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myClassPojo)
  })
})

describe('MyClass instance members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6ClassInfo.from(MyClass)
    pojo = await fnInfo.toPojo({
      isStatic: false,
      isKnown: false,
      isNonPublic: false,
    })
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myClassInstancePojo)
  })
})

describe('MyClass static members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6ClassInfo.from(MyClass)
    pojo = await fnInfo.toPojo({
      isKnown: false,
      isNonPublic: false,
      isStatic: true,
    })
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myClassStaticPojo)
  })
})

describe('MyClass own members', () => {
  let pojo
  beforeEach(async () => {
    const fnInfo = Es6ClassInfo.from(MyClass)
    pojo = await fnInfo.toPojo({
      ownOnly: true,
      isKnown: false,
      isNonPublic: false,
    })
  })

  it('matches expected', () => {
    expect(pojo).toEqual(myClassOwnPojo)
  })
})
