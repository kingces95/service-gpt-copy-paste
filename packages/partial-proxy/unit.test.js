import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import {
  TypePrecondition,
  TypePostcondition,
  MemberPrecondition,
  MemberPostcondition,
  PartialProxyReflect,
  PartialProxy
} from '@kingjs/partial-proxy'

function typePrecondition() {
  this.push('typePrecondition')
}

function typePostcondition() {
  this.push('typePostcondition')
}

function memberPrecondition() {
  this.push('memberPrecondition')
}

function memberPostcondition() {
  this.push('memberPostcondition')
}

class MyEmptyType {
}

class MyType extends PartialProxy {
  static [TypePrecondition] = typePrecondition
  static [TypePostcondition] = typePostcondition
}

class MyExtendedType extends MyType { }

const TypeWithNoConditions = {
  type: MyEmptyType,
}

const TypeWithConditions = {
  type: MyType,
  typePrecondition,
  typePostcondition,
}

const ExtendedTypeWithConditions = {
  type: MyExtendedType,
  typePrecondition,
  typePostcondition,
}

const Tests = [
  ['TypeWithConditions', TypeWithConditions],
  ['TypeWithNoConditions', TypeWithNoConditions],
  ['ExtendedTypeWithConditions', ExtendedTypeWithConditions],
]

describe.each(Tests)('%s', 
  (name, { type, typePrecondition, typePostcondition }) => {

  let instance
  beforeEach(() => {
    instance = new type()
  })

  it('should have correct type precondition', () => {
    const actual = PartialProxyReflect.typePrecondition(type)
    expect(actual == typePrecondition).toBe(true)
  })
})