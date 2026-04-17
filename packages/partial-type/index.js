import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Compile, Declarations, Transparent } from '@kingjs/partial-symbols'
import { isPojo } from '@kingjs/pojo-test'
import { es6DefineType } from '@kingjs/es6-define-type'
import { Define } from '@kingjs/partial-symbols'

export {
  Compile,
  Declarations,
  Transparent,
} from '@kingjs/partial-symbols'

export class PartialType extends null {
  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [Transparent] = false
  static [Declarations] = { }
  static [Define](pojo) {
    assert(this[Transparent],
      'Only transparent PartialTypes can be defined from a pojo.')
    assert(isPojo(pojo),
      'Argument must be a pojo.')
      
    return es6DefineType(null, this, pojo)
  }
  static [Compile](descriptor) { 
    return Es6Compiler.compile(descriptor) 
  }
}
