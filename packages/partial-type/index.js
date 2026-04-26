import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { isPojo } from '@kingjs/pojo-test'
import { es6DefineType } from '@kingjs/es6-define-type'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { 
  Compile, 
  Adjacent, 
  Transparent,
  From,
} from '@kingjs/partial-symbols'

export {
  Compile,
  Adjacent,
  Transparent,
  From,
} from '@kingjs/partial-symbols'

export class PartialType extends null {
  
  static isUserDefined(type) {
    if (!type) return false
    if (type == PartialType) return false
    if (Object.getPrototypeOf(type) == PartialType) return false
    return Es6UserReflect.isExtensionOf(type, PartialType)    
  }

  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [Transparent] = false
  static [Adjacent] = { }
  static [From](typeOrPojo) {
    if (typeof typeOrPojo == 'function') {
      assert(Es6UserReflect.isExtensionOf(typeOrPojo, PartialType),
        `Type "${typeOrPojo.name}" is not an extension of ` + 
        `expected type "${this.name}".`)
      
      return typeOrPojo
    }
    assert(isPojo(typeOrPojo),
      'Argument must be a type or pojo.')
    assert(this[Transparent],
      'Only transparent PartialTypes can be defined from a pojo.')
      
    return es6DefineType(null, this, typeOrPojo)
  }
  static [Compile](descriptor) { 
    return Es6Compiler.compile(descriptor) 
  }
}
