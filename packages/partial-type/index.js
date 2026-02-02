import { assert } from '@kingjs/assert'
import { Compiler } from '@kingjs/compiler'
import { Es6Reflect } from '@kingjs/es6-reflect'

// PartialType in conjction with extend is like 
// Object.defineProperties but with richer descriptors. For example,
// PartialPojo which extends PartialType, can be crated with a 
// POJO whose properties are "compiled" into property descriptors. For 
// example, a method can be defined like this:
//    const MyPartial = PartialReflect.load({
//      myMethod() { ... }
//    }) 

// The method could also be defined using a descriptor:
//    const MyPartial = PartialReflect.load({
//      myMethod: { value: function() { ... } }
//    })

// Or as a lambda:
//    const MyPartial = PartialReflect.load({
//      myMethod: () => { ... }
//    })

// Or using a named function like 'abstract':
//    import { abstract } from '@kingjs/abstract'
//    const MyPartial = PartialReflect.load({
//      myMethod: abstract
//    })

// An accessor can be defined like this:
//    const MyPartial = PartialReflect.load({
//      get myProperty() { ... },
//      set myProperty(value) { ... },
//    })

// A constant can be defined like this:
//    const MyPartial = PartialReflect.load({
//      myConstant: { 
//        value: 42, 
//        enumerable: true, 
//        configurable: false, 
//        writable: false 
//      }
//    })

// The PartialPojo can then be merged into a type like this:
//    class MyType { }
//    extend(MyType, MyPartial)
// Now MyType.prototype has myMethod, or myProperty, or myConstant
// defined on it. 

// The method 'abstract' is known and if a type already
// has a concrete implementation of the method, it is not overwritten.

// OwnCollectionSymbols is a static symbol applied to extensions of 
// PartialType which describes how those extensions form a poset of 
// PartialType types.
const OwnCollectionSymbols = Symbol('PartialType.ownCollectionSymbols')

// For example, OwnCollectionSymbols is used by PartialClass to designate
// the Extends symbol as containing an adjacency list to other PartialType
// types of type PartialClass and PartialPojo. Also specified is
// a coercion method PartialReflect.load is used to transform POJOs 
// into PartialClass types:

//    class PartialClass extends PartialType {
//      static [PartialType.OwnCollectionSymbols] = {
//        [Extends]: { 
//          expectedType: [ PartialClass, PartialPojo ],
//          map: PartialReflect.load,
//        }
//      }
//    }

// The simplest use of the Extends symbol is to apply a PartialPojo 
// type expressed as a POJO. A single extension can exist as a single element of an
// array or unwrapped like this:

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

export class PartialType extends null {
  static Compile = Compile
  static OwnCollectionSymbols = OwnCollectionSymbols

  constructor() { 
    throw new TypeError('PartialType cannot be instantiated.') 
  }

  static [OwnCollectionSymbols] = { }
  static [Compile](descriptor) { 
    return Compiler.compile(descriptor) 
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
    return Es6Reflect.isKnownKey(type, key, { isStatic })
  }

  static isPartialUrType(type) {
    if (type == PartialType) return true
    return Object.getPrototypeOf(type) == PartialType
  }
  static baseType(type) {
    if (PartialTypeReflect.isPartialUrType(type))
      return Es6Reflect.baseType(type)

    const result = Es6Reflect.baseType(type)
    if (PartialTypeReflect.isPartialUrType(result))
      return null

    return result
  }
  static isPartialType(type) {
    if (!Es6Reflect.isExtensionOf(type, PartialType)) return false
    if (PartialTypeReflect.isPartialUrType(type)) return false
    // assert(PartialTypeReflect.isPartialUrType(Object.getPrototypeOf(type)),
    //   `Expected type to indirectly extend PartialType.`)
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