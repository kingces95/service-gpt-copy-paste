import { assert } from '@kingjs/assert'
import { Es6Compiler } from '@kingjs/es6-compiler'
import { Es6Reflect } from '@kingjs/es6-reflect'

// PartialType + extend is Object.defineProperties with richer descriptors. 

// PartialTypes is a static symbol applied to extensions of 
// PartialType which describes how those extensions form a poset of 
// PartialType types.
const PartialTypes = Symbol('PartialType.partialTypes')

// For example, PartialTypes is used by PartialClass to designate
// the Extends symbol as containing an adjacency list to other PartialType
// types of type PartialClass and Extensions. Also specified is
// a coercion method PartialReflect.load is used to transform POJOs 
// into PartialClass types:

//    class PartialClass extends PartialType {
//      static [PartialType.PartialTypes] = {
//        [Extends]: { 
//          expectedType: [ PartialClass, Extensions ],
//          map: PartialReflect.load,
//        }
//      }
//    }

// The simplest use of the Extends symbol is to apply an Extensions 
// type expressed as a POJO. A single extension can exist as a single 
// element of an array or unwrapped like this:

//    class MyExtension extends PartialClass {
//      static [Extends] = { 
//        myMethod() { ... } 
//        myOtherMethod() { ... }
//      }
//    }

// The Extends symbol can contain an array of member collections like this:

//    class MyMethodGroup extends PartialClass {
//      myMethod() { ... }
//    }
//    class MyExtension extends PartialClass {
//      static [Extends] = [ 
//        MyMethodGroup,
//        { myOtherMethod() { ... } },
//      ]
//    }

// The Extends can then be merged into a type using extend
// like so:

//    class MyType { }
//    extend(MyType, MyExtension)

// Now MyType.prototype has myMethod and myOtherMethod defined on it. 

// Compile is a static symbol applied to extensions of PartialType which
// designates a function that can be used to "compile" member descriptors.
const Compile = Symbol('PartialType.compile')

// For example, Concept PartialType uses Compile to transform its
// descriptors so thay are "abstract" by setting all get/set/value to abstract
// for non-data members. Compile is called with the descriptor and returns 
// a descriptor:

//    import { abstract } from '@kingjs/abstract'
//    class Concept extends PartialType {
//      static [PartialType.Compile](descriptor) {
//        const result = super[PartialType.Compile](descriptor)
//        ... modify result so that all members are abstract ...
//        return result
//      }
//    }

// A EqualityConcept could be defined like this:
//    class EqualityConcept extends Concept {
//      equals(other) { }
//    }

// The EqualityConcept could then be merged into a type like this:

//    class MyType { }
//    extend(MyType, EqualityConcept)

// Now MyType.prototype has an abstract equals method defined on it.

// The EqualityConcept could define an extension member ThrowIfNotEqual
// that uses equals to throw if two instances are not equal:

//   class EqualityConcept extends Concept {
//     static [Extends] = {
//       throwIfNotEqual(other) {
//         if (!this.equals(other)) throw 'Not equal'
//       }
//     }
//     equals(other) { }
//   }
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