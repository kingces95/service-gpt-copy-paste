import { assert } from '@kingjs/assert'
import { Compiler } from '@kingjs/compiler'
import { Es6Reflect } from '@kingjs/es6-reflect'

// PartialObject in conjction with PartialReflect.merge is like 
// Object.defineProperties but with richer descriptors. For example,
// PartialPojo which extends PartialObject, can be crated with a 
// POJO whose properties are "compiled" into property descriptors. For 
// example, a method can be defined like this:
//    const MyPartial = PartialReflect.defineType({
//      myMethod() { ... }
//    }) 

// The method could also be defined using a descriptor:
//    const MyPartial = PartialReflect.defineType({
//      myMethod: { value: function() { ... } }
//    })

// Or as a lambda:
//    const MyPartial = PartialReflect.defineType({
//      myMethod: () => { ... }
//    })

// Or using a named function like 'abstract':
//    import { abstract } from '@kingjs/abstract'
//    const MyPartial = PartialReflect.defineType({
//      myMethod: abstract
//    })

// An accessor can be defined like this:
//    const MyPartial = PartialReflect.defineType({
//      get myProperty() { ... },
//      set myProperty(value) { ... },
//    })

// A constant can be defined like this:
//    const MyPartial = PartialReflect.defineType({
//      myConstant: { 
//        value: 42, 
//        enumerable: true, 
//        configurable: false, 
//        writable: false 
//      }
//    })

// The PartialPojo can then be merged into a type like this:
//    class MyType { }
//    PartialReflect.merge(MyType, MyPartial)
// Now MyType.prototype has myMethod, or myProperty, or myConstant
// defined on it. 

// The method 'abstract' is known and if a type already
// has a concrete implementation of the method, it is not overwritten.

// OwnCollectionSymbols is a static symbol applied to extensions of 
// PartialObject which describes how those extensions form a poset of 
// PartialObject types.
const OwnCollectionSymbols = Symbol('PartialObject.ownCollectionSymbols')

// For example, OwnCollectionSymbols is used by PartialClass to designate
// the Extends symbol as containing an adjacency list to other PartialObject
// types of type PartialClass and PartialPojo. Also specified is
// a coercion method PartialReflect.defineType is used to transform POJOs 
// into PartialClass types:

//    class PartialClass extends PartialObject {
//      static [PartialObject.OwnCollectionSymbols] = {
//        [Extends]: { 
//          expectedType: [ PartialClass, PartialPojo ],
//          map: PartialReflect.defineType,
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

// The Extends can then be merged into a type using PartialReflect.merge
// like so:

//    class MyType { }
//    PartialReflect.merge(MyType, MyExtension)

// Now MyType.prototype has myMethod and myOtherMethod defined on it. 

// Compile is a static symbol applied to extensions of PartialObject which
// designates a function that can be used to "compile" member descriptors.
const Compile = Symbol('PartialObject.compile')

// For example, Concept PartialObject uses Compile to transform its
// descriptors so thay are "abstract" by setting all get/set/value to abstract
// for non-data members. Compile is called with the descriptor and returns 
// a descriptor:

//    import { abstract } from '@kingjs/abstract'
//    class Concept extends PartialObject {
//      static [PartialObject.Compile](descriptor) {
//        const result = super[PartialObject.Compile](descriptor)
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
//    PartialReflect.merge(MyType, EqualityConcept)

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

export class PartialObject {
  static Compile = Compile
  static OwnCollectionSymbols = OwnCollectionSymbols

  constructor() { 
    throw new TypeError('PartialObject cannot be instantiated.') 
  }

  static [OwnCollectionSymbols] = { }
  static [Compile](descriptor) { 
    return Compiler.compile(descriptor) 
  }
}

export class PartialObjectReflect {
  static isKnown(type) {
    if (!type) return false
    if (Es6Reflect.isKnown(type)) return true
    if (type == PartialObject) return true
    if (Object.getPrototypeOf(type) == PartialObject) return true
    
    return false
  }
  static isKnownKey(type, key, { isStatic } = { }) {
    if (PartialObjectReflect.isKnown(type)) return true
    return Es6Reflect.isKnownKey(type, key, { isStatic })
  }

  static isPartialObject(type) {
    return PartialObjectReflect.getPartialObjectType(type) != null
  }
  static getPartialObjectType(type) {
    const prototype = Object.getPrototypeOf(type)
    if (prototype == PartialObject) return null
    if (Object.getPrototypeOf(prototype) != PartialObject) {
      assert(!(prototype.prototype instanceof PartialObject),
        `Expected type to indirectly extend PartialObject.`)
      return null
    }

    return prototype
  }
}