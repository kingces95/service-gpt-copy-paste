import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'

const Declarations = Symbol('PartialType.declarations')
const Compile = Symbol('PartialType.compile')

export const Thunk = Symbol('PartialType.Thunk')
export const Preconditions = Symbol('PartialType.Preconditions')
export const Postconditions = Symbol('PartialType.Postconditions')
export const TypePrecondition = Symbol('PartialType.TypePrecondition')
export const TypePostcondition = Symbol('PartialType.TypePostcondition')
export const Prototype = Symbol('PartialType.Prototype')

export class PartialType extends null {
  static Compile = Compile
  static Declarations = Declarations

  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [Declarations] = { }
  static [Compile](descriptor) { 
    return Es6Compiler.compile(descriptor) 
  }
}
