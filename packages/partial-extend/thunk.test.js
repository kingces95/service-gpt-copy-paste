import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { define } from '@kingjs/partial-define'
import { 
  Defaults,
  Transforms,
  TypePrecondition,
  TypePostcondition,
  Preconditions,
  Postconditions,
} from '@kingjs/partial-proxy'
import { PartialProxy } from '@kingjs/partial-proxy'
import { extend } from '@kingjs/partial-extend'
import { Abstracts, PartialClass } from '@kingjs/partial-class'
import { defaultTo } from '@kingjs/function-args'

class MyType extends PartialProxy {
  static [TypePrecondition] = function myTypePrecondition() {
    this.push('MyType:typePrecondition')
  }
  static [TypePostcondition] = function myTypePostcondition() {
    this.push('MyType:typePostcondition')
  }
  static [Preconditions] = {
    method: function() { this.push('MyType:method:precondition') },
    getter: function() { this.push('MyType:getter:precondition') },
    setter: function() { this.push('MyType:setter:precondition') },
    get property() { this.push('MyType:property:get:precondition') },
    set property(value) { this.push('MyType:property:set:precondition') },
  }
  static [Postconditions] = {
    method: function() { this.push('MyType:method:postcondition') },
    getter: function() { this.push('MyType:getter:postcondition') },
    setter: function() { this.push('MyType:setter:postcondition') },
    get property() { this.push('MyType:property:get:postcondition') },
    set property(_) { this.push('MyType:property:set:postcondition') }
  }

  constructor() {
    super()
    this._calls = []
  }

  static {
    define(this, {
      method: function() { this.push('MyType:method') },
      get getter() { this.push('MyType:getter') },
      set setter(value) { this.push('MyType:setter') },
      get property() { this.push('MyType:property') },
      set property(_) { this.push('MyType:property') },
    })
  }

  push(value) { this._calls.push(value) }
  get calls() { return this._calls }
}

const MethodTest = {
  member: 'method',
  type: 'method',
  precondition: 'method:precondition',
  postcondition: 'method:postcondition',
}

const GetterTest = {
  member: 'getter',
  type: 'getter',
  precondition: 'getter:precondition',
  postcondition: 'getter:postcondition',
}

const SetterTest = {
  member: 'setter',
  type: 'setter',
  precondition: 'setter:precondition',
  postcondition: 'setter:postcondition',
}

const PropertyGetTest = {
  member: 'property',
  type: 'getter',
  precondition: 'property:get:precondition',
  postcondition: 'property:get:postcondition',
}

const PropertySetTest = {
  member: 'property',
  type: 'setter',
  precondition: 'property:set:precondition',
  postcondition: 'property:set:postcondition',
}

const Tests = [
  ['Method', MethodTest],
  ['Getter', GetterTest],
  ['Setter', SetterTest],
  ['Property (set)', PropertyGetTest],
  ['Property (set)', PropertySetTest],
]

describe('Instance of MyType', () => {
  let instance
  beforeEach(() => {
    instance = new MyType()
  })

  describe.each(Tests)('%s', (_, { 
    member, type, precondition, postcondition }) => {

    it(`should have ${type} conditions called`, () => {
      switch (type) {
        case 'method':
          instance[member]()
          break
        case 'getter':
          instance[member]
          break
        case 'setter':
          instance[member] = 'value'
          break
        default:
          throw new Error(`Unknown type ${type}`)
      }

      expect(instance.calls).toEqual([
        'MyType:typePrecondition',
        `MyType:${precondition}`,
        `MyType:${member}`,
        `MyType:${postcondition}`,
        'MyType:typePostcondition',
      ])
    })
  })
})

function upper(value) {
  return value.toUpperCase()
}

class BaseTransformPart extends PartialClass {
  static [Transforms] = {
    inherited: [upper],
    suppliedInherited: [upper],
    override: [upper],
  }

  static [Abstracts] = {
    suppliedInherited(value) { },
  }

  override(value) {
    this.push(`override:base:${value}`)
  }
}

class TransformPart extends BaseTransformPart {
  static [Transforms] = {
    own: [upper],
    ownSecond: [null, upper],
    ownDefault: [null, upper],
    supplied: [upper],
  }

  static [Defaults] = {
    ownDefault: [
      undefined,
      defaultTo(({ args: [first] }) => first),
    ],
  }

  static [Abstracts] = {
    supplied(value) { },
  }

  own(value) {
    this.push(`own:${value}`)
  }

  ownSecond(first, second) {
    this.push(`ownSecond:${first}:${second}`)
  }

  ownDefault(first, second = first) {
    this.push(`ownDefault:${first}:${second}`)
  }

  inherited(value) {
    this.push(`inherited:${value}`)
  }

  override(value) {
    this.push(`override:${value}`)
  }
}

class TransformType extends PartialProxy {
  static [Preconditions] = {
    own(value) { this.push(`own:precondition:${value}`) },
    ownSecond(first, second) {
      this.push(`ownSecond:precondition:${first}:${second}`)
    },
    ownDefault(first, second) {
      this.push(`ownDefault:precondition:${first}:${second}`)
    },
    supplied(value) { this.push(`supplied:precondition:${value}`) },
    inherited(value) { this.push(`inherited:precondition:${value}`) },
    suppliedInherited(value) {
      this.push(`suppliedInherited:precondition:${value}`)
    },
    override(value) { this.push(`override:precondition:${value}`) },
  }

  constructor() {
    super()
    this._calls = []
  }

  static {
    extend(this, BaseTransformPart, {
      suppliedInherited(value) {
        this.push(`suppliedInherited:${value}`)
      },
    })

    extend(this, TransformPart, {
      supplied(value) {
        this.push(`supplied:${value}`)
      },
    })
  }

  push(value) { this._calls.push(value) }
  get calls() { return this._calls }
}

const TransformTests = [
  ['declared member', {
    member: 'own',
    args: ['a'],
    calls: [
      'own:precondition:a',
      'own:A',
    ],
  }],
  ['declared member second slot', {
    member: 'ownSecond',
    args: ['x', 'a'],
    calls: [
      'ownSecond:precondition:x:a',
      'ownSecond:x:A',
    ],
  }],
  ['declared member defaulted transform slot', {
    member: 'ownDefault',
    args: ['a'],
    calls: [
      'ownDefault:precondition:a:a',
      'ownDefault:a:A',
    ],
  }],
  ['override ignores inherited transform metadata', {
    member: 'override',
    args: ['a'],
    calls: [
      'override:precondition:a',
      'override:a',
    ],
  }],
  ['inherited member ignores inherited transform metadata', {
    member: 'inherited',
    args: ['a'],
    calls: [
      'inherited:precondition:a',
      'inherited:a',
    ],
  }],
  ['supplied definition ignores extended part transform metadata', {
    member: 'supplied',
    args: ['a'],
    calls: [
      'supplied:precondition:a',
      'supplied:a',
    ],
  }],
  ['supplied definition inherited metadata', {
    member: 'suppliedInherited',
    args: ['a'],
    calls: [
      'suppliedInherited:precondition:a',
      'suppliedInherited:a',
    ],
  }],
]

describe('Argument transforms', () => {
  let instance
  beforeEach(() => {
    instance = new TransformType()
  })

  describe.each(TransformTests)('%s', (_, { member, args, calls }) => {
    it('applies transforms at the implementation boundary', () => {
      instance[member](...args)
      expect(instance.calls).toEqual(calls)
    })
  })
})
