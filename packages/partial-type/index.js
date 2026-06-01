import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { isPojo } from '@kingjs/pojo-test'
import { declareType } from '@kingjs/es6-define'
import { Es6UserReflect } from '@kingjs/es6-user-reflect'
import { 
  Compile, 
  Adjacent, 
  Redeclare,
  Declarative,
  Procedural,
  Transparent,
  Normalize,
} from '@kingjs/partial-symbols'

export {
  Compile,
  Adjacent,
  Redeclare,
  Declarative,
  Procedural,
  Transparent,
  Normalize,
} from '@kingjs/partial-symbols'

const families = new WeakMap()

export class PartialType extends null {
  
  static isUserDefined(type) {
    if (!type || type == PartialType) return false
    if (Object.getPrototypeOf(type) == PartialType) return false
    return Es6UserReflect.isExtensionOf(type, PartialType)
  }

  static isFamily(type) {
    if (!type || type == PartialType) return false
    return Object.getPrototypeOf(type) == PartialType
  }

  static getFamily(type) {
    if (!PartialType.isUserDefined(type))
      return null

    let result = families.get(type)

    if (!result) {
      result = PartialType.#family(type)
      families.set(type, result)
    }

    return result
  }

  static isSameFamily(left, right) {
    const family = PartialType.getFamily(left)
    return family != null && family == PartialType.getFamily(right)
  }

  static #family(type) {
    let result = type

    while (true) {
      const extendedType = Es6UserReflect.getExtendedType(result)

      if (!extendedType || extendedType == PartialType)
        return result

      if (!Es6UserReflect.isExtensionOf(extendedType, PartialType))
        return result

      result = extendedType
    }
  }

  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [Transparent] = false
  static [Adjacent] = [ ]
  static [Redeclare] = [ ]
  static [Declarative] = null
  static [Procedural] = null
  static [Normalize](typeOrPojo) {
    assert(PartialType.isFamily(this),
      '[Normalize] must be invoked on a PartialType family.')

    let result

    if (typeof typeOrPojo == 'function') {
      result = typeOrPojo
    } else {
      assert(isPojo(typeOrPojo),
        'Argument must be a type or pojo.')
      assert(this[Transparent],
        'Only a transparent PartialType can be defined from a pojo.')

      result = declareType(null, this, typeOrPojo)
    }

    const resultName = result?.name ?? typeof result

    assert(result == this || Es6UserReflect.isExtensionOf(result, this),
      `${this.name}[Normalize] expected a ${this.name}; got ${resultName}.`)

    return result
  }
  static [Compile](descriptor) {
    return Es6Compiler.compile(descriptor)
  }
}
