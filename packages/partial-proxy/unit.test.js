import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { abstract } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'
import { 
  CreateThunk,
  TypeChecks,
  ThisChecks,
  ArgChecks,
  TypePrecondition,
  TypePostcondition,
  Preconditions,
  Postconditions,
  PartialProxy,
} from '@kingjs/partial-proxy'
import { getConditions } from '@kingjs/partial-metadata'

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
function myOtherPrecondition() {
  this.push('MyType:otherPrecondition')
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

// -- Declarative Checks --

class TypeReady {
  static [Symbol.hasInstance](value) {
    value.push('MyType:typeCheck')
    return true
  }
}

class ExtendedTypeReady {
  static [Symbol.hasInstance](value) {
    value.push('MyExtendedType:typeCheck')
    return true
  }
}

class ThisReady {
  static [Symbol.hasInstance](value) {
    value.push('MyType:thisCheck')
    return true
  }
}

class ExtendedThisReady {
  static [Symbol.hasInstance](value) {
    value.push('MyExtendedType:thisCheck')
    return true
  }
}

class FirstArg {
  static [Symbol.hasInstance](value) {
    value.push('MyType:firstArgCheck')
    return true
  }
}

class ExtendedFirstArg {
  static [Symbol.hasInstance](value) {
    value.push('MyExtendedType:firstArgCheck')
    return true
  }
}

class SecondArg {
  static [Symbol.hasInstance](value) {
    value.push('MyType:secondArgCheck')
    return true
  }
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
  static [TypeChecks] = TypeReady
  static [TypePrecondition] = myTypePrecondition
  static [TypePostcondition] = myTypePostcondition
  static [ThisChecks] = { member: ThisReady }
  static [ArgChecks] = { member: [FirstArg, SecondArg] }
  static [Preconditions] = { member: myPrecondition }
  static [Postconditions] = { member: myPostcondition }
  member(first, second) { this.push('MyType:member') }
}

class MyExtendedType extends MyType { 
  static [TypeChecks] = [ExtendedTypeReady]
  static [TypePrecondition] = myExtendedTypePrecondition
  static [TypePostcondition] = myExtendedTypePostcondition
  static [ThisChecks] = { member: [ExtendedThisReady] }
  static [ArgChecks] = { member: [ExtendedFirstArg] }
  static [Preconditions] = { member: myExtendedPrecondition }
  static [Postconditions] = { member: myExtendedPostcondition }
  member(first, second) { super.member(first, second) }
}

class MyTypeWithPreconditionList extends MyBaseType {
  static [Preconditions] = {
    member: [
      myPrecondition,
      myOtherPrecondition,
    ],
  }
  member() { this.push('MyTypeWithPreconditionList:member') }
}

// -- Test Cases --

const TypeWithoutConditions = {
  type: MyVanillaType,
}

const AbstractType = {
  type: MyAbstractType,
  conditions: {
    typePrecondition: [myTypePrecondition],
    typePostcondition: [myTypePostcondition],
    precondition: [myPrecondition],
    postcondition: [myPostcondition],
  },
}

const Type = {
  type: MyType,
  conditions: {
    typePrecondition: [
      expect.any(Function),
      myTypePrecondition,
    ],
    typePostcondition: [myTypePostcondition],
    precondition: [
      expect.any(Function),
      expect.any(Function),
      myPrecondition,
    ],
    postcondition: [myPostcondition],
  },
  calls: [
    'MyType:typeCheck',
    'MyType:typePrecondition',
    'MyType:thisCheck',
    'MyType:firstArgCheck',
    'MyType:secondArgCheck',
    'MyType:precondition',
    'MyType:member',
    'MyType:postcondition',
    'MyType:typePostcondition',
  ],
  args: actual => [actual, actual],
}

const ExtendedType = {
  type: MyExtendedType,
  conditions: {
    typePrecondition: [
      expect.any(Function),
      expect.any(Function),
      myTypePrecondition,
      myExtendedTypePrecondition,
    ],
    typePostcondition: [myTypePostcondition, myExtendedTypePostcondition],
    precondition: [
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      myPrecondition,
      myExtendedPrecondition,
    ],
    postcondition: [myPostcondition, myExtendedPostcondition],
  },
  calls: [
    'MyType:typeCheck',
    'MyExtendedType:typeCheck',
    'MyType:typePrecondition',
    'MyExtendedType:typePrecondition',
    'MyType:thisCheck',
    'MyExtendedType:thisCheck',
    'MyType:firstArgCheck',
    'MyType:secondArgCheck',
    'MyExtendedType:firstArgCheck',
    'MyType:precondition',
    'MyExtendedType:precondition',
    'MyType:member',
    'MyType:postcondition',
    'MyExtendedType:postcondition',
    'MyType:typePostcondition',
    'MyExtendedType:typePostcondition',
  ],
  args: actual => [actual, actual],
}

const TypeWithPreconditionList = {
  type: MyTypeWithPreconditionList,
  conditions: {
    precondition: [
      myPrecondition,
      myOtherPrecondition,
    ],
  },
  calls: [
    'MyType:precondition',
    'MyType:otherPrecondition',
    'MyTypeWithPreconditionList:member',
  ],
}

const Tests = [
  ['Type without conditions', TypeWithoutConditions],
  ['Abstract type', AbstractType],
  ['Type', Type],
  ['Extended type', ExtendedType],
  ['Type with precondition list', TypeWithPreconditionList],
]

// -- Tests --

describe.each(Tests)('%s', 
  (_, { type, conditions, calls, args }) => {

  let thunk
  let instance
  let descriptor 
  beforeEach(() => {
    instance = new type()
    descriptor = Descriptor.get(type.prototype, 'member')
    thunk = type[CreateThunk]('member', descriptor)
  })

  it('should have the correct type conditions', () => {
    const actual = getConditions(type, 'member')
    expect(actual).toEqual(conditions)
  })  
  it('should execute the correct conditions in the correct order', () => {
    if (!calls) return

    const actual = new type()
    const actualArgs = typeof args == 'function' ? args(actual) : args
    thunk.value.call(actual, ...(actualArgs ?? []))
    expect(actual.array).toEqual(calls)
  })
})
