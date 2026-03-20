import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { isAbstract } from '@kingjs/abstract'

const Declarations = Symbol('PartialType.partialTypes')
const Compile = Symbol('PartialType.compile')

export const Thunk = Symbol('PartialType.Thunk')
export const Preconditions = Symbol('PartialType.Preconditions')
export const Postconditions = Symbol('PartialType.Postconditions')
export const TypePrecondition = Symbol('PartialType.TypePrecondition')
export const TypePostcondition = Symbol('PartialType.TypePostcondition')
export const Prototype = Symbol('PartialType.Prototype')
export const Constructors = Symbol('PartialType.Constructors')

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
  static isKnown(type) {
    if (!type) return false
    if (Es6Reflect.isKnown(type)) return true
    return PartialTypeReflect.isPartialUrType(type)
  }
  static isKnownKey(type, key, { isStatic } = { }) {
    if (PartialTypeReflect.isKnown(type)) return true
    if (isStatic) {
      if (key == Thunk) return true
      if (key == Preconditions) return true
      if (key == Postconditions) return true
      if (key == TypePrecondition) return true
      if (key == TypePostcondition) return true
      if (key == Prototype) return true
    } else {
      if (key == Constructors) return true
    }
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
  
  // TODO: Consider moving defineProperty and defineType
  // to their own home. They are independent of PartialType.
  // They were moved here out of convenience during a refactor.
  static defineProperty(type, key, descriptor) {
    const prototype = type.prototype

    if (key in prototype && isAbstract(descriptor)) return false

    Object.defineProperty(prototype, key, descriptor)
    return true
  }

  static defineType(name = null, base = Object, pojo = { }) {
    const [type] = [class extends base { }]
    
    Object.defineProperties(type, {
      name: {
        value: name,
        configurable: true,
        enumerable: false,
        writable: false,
      }
    })

    const prototype = type.prototype
    for (const key of Reflect.ownKeys(pojo)) {
      if (key === 'constructor') continue
      const descriptor = Object.getOwnPropertyDescriptor(pojo, key)
      Object.defineProperty(prototype, key, descriptor)
    }

    return type
  }
}