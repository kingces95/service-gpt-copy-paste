import { describe, it, expect } from 'vitest'
import { Preconditions, contract } from '@kingjs/function-contract'
import {
  DefaultConstructible,
  PushBackContainer,
} from '@kingjs/cursor-checks'
import { result } from 'lodash'

class Bag {
  push(value) { }
}

const Overloads = {
  None: {
    args: [[[
      DefaultConstructible,
      PushBackContainer,
    ]], [ null ],
    function create(Type) { return new Type() }],
    resultType: Bag,
  },

  NoFunction: {
    args: [[[
      DefaultConstructible,
      PushBackContainer,
    ]], [ null ]],
  },

  NoDefaults: {
    args: [[[
      DefaultConstructible,
      PushBackContainer,
    ]],
    function create(Type) { return new Type() }],
    resultType: Bag,
  }
}

describe.each(Object.entries(Overloads))(
  'Overload: %s', (name, { args, resultType }) => {

  it('should check for default constructible push containers', () => {
    const checkedCreate = contract(...args)
    
    if (resultType) 
        expect(checkedCreate(Bag)).toBeInstanceOf(resultType)
    expect(() => checkedCreate(class NoPush { })).toThrow(
      'NoPush must define push(value).')
    expect(() => checkedCreate(null)).toThrow(
      'Argument must be a constructor.')    
    })
  }
)
