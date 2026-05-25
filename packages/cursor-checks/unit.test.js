import { describe, it, expect } from 'vitest'
import { contract } from '@kingjs/function-contract'
import {
  DefaultConstructible,
  PushBackContainer,
} from '@kingjs/cursor-checks'

class Bag {
  pushBack(value) { }
}

const Overloads = {
  None: {
    args: [[[
      DefaultConstructible,
      PushBackContainer,
    ]],
    function create(Type) { return new Type() }],
    resultType: Bag,
  },

  Thunk: {
    args: [[[
      DefaultConstructible,
      PushBackContainer,
    ]]],
  },
}

describe.each(Object.entries(Overloads))(
  'Overload: %s', (name, { args, resultType }) => {

  it('should check for default constructible push-back containers', () => {
    const checkedCreate = contract(...args)
    
    if (resultType) 
        expect(checkedCreate(Bag)).toBeInstanceOf(resultType)
    expect(() => checkedCreate(class NoPushBack { })).toThrow(
      'NoPushBack must define pushBack(value).')
    expect(() => checkedCreate(null)).toThrow(
      'Argument must be a constructor.')    
    })
  }
)
