import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { extend } from '@kingjs/partial-extend'
import { 
  TypePrecondition,
  TypePostcondition,
  Preconditions,
  Postconditions,
} from '@kingjs/partial-type'
import { PartialProxy } from '@kingjs/partial-proxy'

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
    extend(this, {
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
