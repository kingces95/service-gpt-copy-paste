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

export class PartialTypeReflect {

  static #isPartialUrType(type) {
    if (!type) return false
    if (type == PartialType) return true
    return Object.getPrototypeOf(type) == PartialType
  }
  static getBaseType(type) {
    if (!type) return null

    if (PartialTypeReflect.#isPartialUrType(type))
      return Es6UserReflect.getBaseType(type)

    const result = Es6UserReflect.getBaseType(type)
    if (PartialTypeReflect.#isPartialUrType(result))
      return null

    return result
  }
  static isPartialType(type) {
    if (!Es6UserReflect.isExtensionOf(type, PartialType)) return false
    if (PartialTypeReflect.#isPartialUrType(type)) return false
    return true
  }
  static getPartialType(type) {
    if (!PartialTypeReflect.isPartialType(type)) return null

    let baseType = type
    while (baseType = Es6UserReflect.getBaseType(baseType)) 
      if (PartialTypeReflect.#isPartialUrType(baseType)) return baseType

    return null
  }
}