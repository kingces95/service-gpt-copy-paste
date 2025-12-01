import { Compiler } from '@kingjs/compiler'

// MemberCollection in conjction with MemberReflect.merge is like 
// Object.defineProperties but with richer descriptors. For example,
// PartialClass which extends MemberCollection, can be crated with a 
// POJO whose properties are "compiled" into property descriptors. For 
// example, a method can be defined like this:
//    const MyPartial = PartialClass.create({
//      myMethod() { ... }
//    }) 

// The method could also be defined using a descriptor:
//    const MyPartial = PartialClass.create({
//      myMethod: { value: function() { ... } }
//    })

// Or as a lambda:
//    const MyPartial = PartialClass.create({
//      myMethod: () => { ... }
//    })

// Or using a named function like 'abstract':
//    import { abstract } from '@kingjs/abstract'
//    const MyPartial = PartialClass.create({
//      myMethod: abstract
//    })

// An accessor can be defined like this:
//    const MyPartial = PartialClass.create({
//      get myProperty() { ... },
//      set myProperty(value) { ... },
//    })

// A constant can be defined like this:
//    const MyPartial = PartialClass.create({
//      myConstant: { 
//        value: 42, 
//        enumerable: true, 
//        configurable: false, 
//        writable: false 
//      }
//    })

// The PartialClass can then be merged into a type like this:
//    class MyType { }
//    MemberReflect.merge(MyType, MyPartial)
// Now MyType.prototype has myMethod, or myProperty, or myConstant
// defined on it. The method 'abstract' is known and if a type already
// has a concrete implementation of the method, it is not overwritten.

// OwnCollectionSymbols is a static symbol applied to extensions of 
// MemberCollections which describes how sub MemberCollections are 
// associated with the MemberCollection so that the poset of associated 
// types can be traversed.
const OwnCollectionSymbols = Symbol('MemberCollection.ownCollectionSymbols')

// For example, OwnCollectionSymbols is used by ExtensionGroup to designate
// the Extensions symbol as containing own member collections and specifies 
// that the sub collections must be either ExtensionGroup or a PartialType. 
// class ExtensionGroup extends MemberCollection {
//   static [MemberCollection.OwnCollectionSymbols] = {
//     [Extensions]: { 
//       expectedType: [ ExtensionGroup, PartialClass ],
//       map: PartialClass.fromArg,
//     }
//   }
// }

// The simplest case is when the Extensions symbol contains a single
// member collection expressed as a POJO. ExtensionGroup specifies a
// coercion method PartialClass.fromArg which will transform the POJO into
// a partial class. For example:
//   class MyExtension extends ExtensionGroup {
//     static [Extensions] = { 
//       myMethod() { ... } 
//       myOtherMethod() { ... }
//     }
//   }

// The Extensions symbol can also contain an array of member collections:
//    class MyMethodGroup extends ExtensionGroup {
//      myMethod() { ... }
//    }
//    class MyExtension extends ExtensionGroup {
//      static [Extensions] = [ 
//        MyMethodGroup,
//        { myOtherMethod() { ... } },
//      ]
//    }

// The Extensions can then be merged into a type using MemberReflect.merge
// like so:
//   class MyType { }
//   MemberReflect.merge(MyType, MyExtension)
// Now MyType.prototype has myMethod and myOtherMethod defined on it. 

// Compile is a static symbol applied to extensions of MemberCollection which
// designates a function that can be used to "compile" member descriptors.
const Compile = Symbol('MemberCollection.compile')

// For example, Concept MemberCollections uses Compile to transform its
// descriptors so thay are "abstract" by setting all get/set/value to abstract
// for non-data members. Compile is called with the descriptor and returns 
// a descriptor:
// import { abstract } from '@kingjs/abstract'
// class Concept extends MemberCollection {
//   static [MemberCollection.Compile](descriptor) {
//     const result = super[MemberCollection.Compile](descriptor)
//     ... modify result so that all members are abstract ...
//     return result
//   }
// }

// A EqualityConcept could be defined like this:
// class EqualityConcept extends Concept {
//   equals(other) { }
// }

// The EqualityConcept could then be merged into a type like this:
// class MyType { }
// MemberReflect.merge(MyType, EqualityConcept)
// Now MyType.prototype has an abstract equals method defined on it.

// The EqualityConcept could define an extension member ThrowIfNotEqual
// that uses equals to throw if two instances are not equal:
//   class EqualityConcept extends Concept {
//     static [Extensions] = {
//       throwIfNotEqual(other) {
//         if (!this.equals(other)) throw 'Not equal'
//       }
//     }
//     equals(other) { }
//   }
// }

export class MemberCollection {
  static Compile = Compile
  static OwnCollectionSymbols = OwnCollectionSymbols

  constructor() { 
    throw new TypeError('MemberCollection cannot be instantiated.') 
  }

  static [OwnCollectionSymbols] = { }
  static [Compile](descriptor) { 
    return Compiler.compile(descriptor) 
  }
}
