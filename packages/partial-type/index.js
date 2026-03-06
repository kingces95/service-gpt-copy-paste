import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Es6Reflect } from '@kingjs/es6-reflect'

const PartialTypes = Symbol('PartialType.partialTypes')
const Compile = Symbol('PartialType.compile')

export const Thunk = Symbol('PartialType.Thunk')
export const Preconditions = Symbol('PartialType.Preconditions')
export const Postconditions = Symbol('PartialType.Postconditions')
export const TypePrecondition = Symbol('PartialType.TypePrecondition')
export const TypePostcondition = Symbol('PartialType.TypePostcondition')

export class PartialType extends null {
  static Compile = Compile
  static PartialTypes = PartialTypes

  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [PartialTypes] = { }
  static [Compile](descriptor) { 
    return Es6Compiler.compile(descriptor) 
  }
}

export class PartialTypeReflect {
  static isKnown(type) {
    if (!type) return false
    if (Es6Reflect.isKnown(type)) return true
    return PartialTypeReflect.isPartialUrType(type)
  }
  static isKnownKey(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnown(type)) return true
    if (key == Thunk) return true
    if (key == Preconditions) return true
    if (key == Postconditions) return true
    if (key == TypePrecondition) return true
    if (key == TypePostcondition) return true
    return Es6Reflect.isKnownKey(type, key, { isStatic })
  }

  static isPartialUrType(type) {
    if (!type) return false
    if (type == PartialType) return true
    return Object.getPrototypeOf(type) == PartialType
  }
  static baseType(type) {
    if (!type) return null

    if (PartialTypeReflect.isPartialUrType(type))
      return Es6Reflect.baseType(type)

    const result = Es6Reflect.baseType(type)
    if (PartialTypeReflect.isPartialUrType(result))
      return null

    return result
  }
  static *hierarchy(type) {
    while (type) {
      yield type
      type = PartialTypeReflect.baseType(type)
    }
  }
  static isPartialType(type) {
    if (!Es6Reflect.isExtensionOf(type, PartialType)) return false
    if (PartialTypeReflect.isPartialUrType(type)) return false
    return true
  }
  static getPartialType(type) {
    if (!PartialTypeReflect.isPartialType(type)) return null

    let baseType = type
    while (baseType = Es6Reflect.baseType(baseType)) 
      if (PartialTypeReflect.isPartialUrType(baseType)) return baseType

    return null
  }
}