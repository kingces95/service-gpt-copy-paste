import { Es6Compiler } from '@kingjs/es6-compiler'
import { Compile, Declarations} from '@kingjs/partial-symbols'

export {
  Compile,
  Declarations,
} from '@kingjs/partial-symbols'

export class PartialType extends null {
  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [Declarations] = { }
  static [Compile](descriptor) { 
    return Es6Compiler.compile(descriptor) 
  }
}
