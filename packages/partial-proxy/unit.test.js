import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { 
  Thunk,
  TypePrecondition,
  TypePostcondition,
  Preconditions,
  Postconditions,
} from '@kingjs/partial-type'
import {
  PartialProxy,
  PartialProxyReflect,
} from '@kingjs/partial-proxy'

// -- Conditions --

function myTypePrecondition() {
  this.push('MyType:typePrecondition')
}
function myTypePostcondition() {
  this.push('MyType:typePostcondition')
}
function myExtendedTypePrecondition() {
  this.push('MyExtendedType:typePrecondition')
}
function myExtendedTypePostcondition() {
  this.push('MyExtendedType:typePostcondition')
}

function myPrecondition() {
  this.push('MyType:precondition')
}
function myPostcondition() {
  this.push('MyType:postcondition')
}
function myExtendedPrecondition() {
  this.push('MyExtendedType:precondition')
}
function myExtendedPostcondition() {
  this.push('MyExtendedType:postcondition')
}

// -- Types --

class MyVanillaType extends PartialProxy {
  member() { }
}

class MyType extends PartialProxy {
  static [TypePrecondition] = myTypePrecondition
  static [TypePostcondition] = myTypePostcondition
  static [Preconditions] = { member: myPrecondition }
  static [Postconditions] = { member: myPostcondition }
  member() { } // abstract
}
MyType.prototype.member = abstract

class MyExtendedType extends MyType { 
  static [TypePrecondition] = myExtendedTypePrecondition
  static [TypePostcondition] = myExtendedTypePostcondition
  static [Preconditions] = { member: myExtendedPrecondition }
  static [Postconditions] = { member: myExtendedPostcondition }
  member() { this.push('member') }
}

// -- Test Cases --

const TypeWithoutConditions = {
  type: MyVanillaType,
}

const TypeWithConditions = {
  type: MyType,
  conditions: {
    type: {
      precondition: [myTypePrecondition],
      postcondition: [myTypePostcondition],
    },
    precondition: { value: [myPrecondition] },
    postcondition: { value: [myPostcondition] },
  },
}

const ExtendedTypeWithConditions = {
  type: MyExtendedType,
  conditions: {
    type: {
      precondition: [myTypePrecondition, myExtendedTypePrecondition],
      postcondition: [myExtendedTypePostcondition, myTypePostcondition],
    },
    precondition: { value: [myPrecondition, myExtendedPrecondition] },
    postcondition: { value: [myExtendedPostcondition, myPostcondition] },
  },
  calls: [
    'MyType:typePrecondition',
    'MyExtendedType:typePrecondition',
    'MyType:precondition',
    'MyExtendedType:precondition',
    'member',
    'MyExtendedType:postcondition',
    'MyType:postcondition',
    'MyExtendedType:typePostcondition',
    'MyType:typePostcondition',
  ]
}

const Tests = [
  ['TypeWithConditions', TypeWithConditions],
  ['TypeWithNoConditions', TypeWithoutConditions],
  ['ExtendedTypeWithConditions', ExtendedTypeWithConditions],
]

// -- Tests --

describe.each(Tests)('%s', 
  (name, { type, conditions, calls }) => {

  let thunk
  let instance
  let descriptor 
  beforeEach(() => {
    instance = new type()
    descriptor = Object.getOwnPropertyDescriptor(type.prototype, 'member')
    thunk = type[Thunk]('member', descriptor)
  })

  it('should have the correct type conditions', () => {
    const actual = PartialProxyReflect.getConditions(type, 'member')
    expect(actual).toEqual(conditions)
  })  
  it('should execute the correct conditions in the correct order', () => {
    if (!calls) return

    const actual = []
    thunk.value.call(actual)
    expect(actual).toEqual(calls)
  })
})