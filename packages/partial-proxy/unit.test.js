import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'
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

// -- Type Conditions --

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

// -- Member Conditions --

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

class MyBaseType extends PartialProxy {
  constructor() {
    super()
    this._array = []
  }

  get array() { return this._array }
  push(value) { this.array.push(value) }
}

class MyAbstractType extends MyBaseType {
  static [TypePrecondition] = myTypePrecondition
  static [TypePostcondition] = myTypePostcondition
  static [Preconditions] = { member: myPrecondition }
  static [Postconditions] = { member: myPostcondition }
  member() { } // abstract
}
MyAbstractType.prototype.member = abstract

class MyType extends MyBaseType {
  static [TypePrecondition] = myTypePrecondition
  static [TypePostcondition] = myTypePostcondition
  static [Preconditions] = { member: myPrecondition }
  static [Postconditions] = { member: myPostcondition }
  member() { this.push('MyType:member') }
}

class MyExtendedType extends MyType { 
  static [TypePrecondition] = myExtendedTypePrecondition
  static [TypePostcondition] = myExtendedTypePostcondition
  static [Preconditions] = { member: myExtendedPrecondition }
  static [Postconditions] = { member: myExtendedPostcondition }
  // member() { this.push('MyExtendedType:member') }
}

// -- Test Cases --

const TypeWithoutConditions = {
  type: MyVanillaType,
}

const AbstractType = {
  type: MyAbstractType,
  conditions: {
    type: {
      precondition: [myTypePrecondition],
      postcondition: [myTypePostcondition],
    },
    precondition: { value: [myPrecondition] },
    postcondition: { value: [myPostcondition] },
  },
}

const Type = {
  type: MyType,
  conditions: {
    type: {
      precondition: [myTypePrecondition],
      postcondition: [myTypePostcondition],
    },
    precondition: { value: [myPrecondition] },
    postcondition: { value: [myPostcondition] },
  },
  calls: [
    'MyType:typePrecondition',
    'MyType:precondition',
    'MyType:member',
    'MyType:postcondition',
    'MyType:typePostcondition',
  ]
}

const ExtendedType = {
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
    'MyType:member',
    'MyExtendedType:postcondition',
    'MyType:postcondition',
    'MyExtendedType:typePostcondition',
    'MyType:typePostcondition',
  ]
}

const ExtendedTypWithoutConditions = {
  type: MyType,
  instanceType: MyExtendedType,
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
    'MyType:member',
    'MyExtendedType:postcondition',
    'MyType:postcondition',
    'MyExtendedType:typePostcondition',
    'MyType:typePostcondition',
  ]
}

const Tests = [
  ['Type without conditions', TypeWithoutConditions],
  ['Abstract type', AbstractType],
  ['Type', Type],
  ['Extended type', ExtendedType],
  ['Extended type without conditions', ExtendedTypWithoutConditions],
]

// -- Tests --

describe.each(Tests)('%s', 
  (_, { type, instanceType = type, conditions, calls }) => {

  let thunk
  let instance
  let descriptor 
  beforeEach(() => {
    instance = new type()
    descriptor = Descriptor.get(type.prototype, 'member')
    thunk = type[Thunk]('member', descriptor)
  })

  it('should have the correct type conditions', () => {
    const actual = PartialProxyReflect.getConditions(instanceType, 'member')
    expect(actual).toEqual(conditions)
  })  
  it('should execute the correct conditions in the correct order', () => {
    if (!calls) return

    const actual = new instanceType()
    thunk.value.call(actual)
    expect(actual.array).toEqual(calls)
  })
})