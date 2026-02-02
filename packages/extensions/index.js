import { Define } from '@kingjs/define'
import { PartialType } from '@kingjs/partial-type'
import { isPojo } from '@kingjs/pojo-test'

// Extensions hosts descriptors that can be copied onto a type.

// An Extensions merged with a type is not associated with the 
// type the way a PartialClass or Concept is nor are copied 
// descriptors associated with the Extensions. After being copied
// the descriptors are indistinguishable from descriptors which
// might have been defined directly on the type. For this reason, 
// Extensions are said to be "transparent". 

// Extensions are typically created dynamically from a pojo by
// calling ExtensionsReflect.define(pojo) and typically this
// call is done inernally while interpreting declarative metadata
// that hosts pojos representing extensions. For example, an
// CursorConcept might define a next() method via a pojo like this:
//   class CursorConcept extends Concept {
//     static [Extends] = { next() { ... } }
//   }
// Here, Extends is well known and interpreted by a loader that
// merges the defined methods into types that extend CursorConcept.
// Such loaders would call ExtensionsReflect.define() internally
// to convert the pojo into an Extensions type.

// Implementing concepts using @kingjs/implement also uses 
// ExtensionsReflect.define() internally to convert pojos
// into Extensions types. For example to implement an equality
// concept using a pojo:
//   class MyClass {
//     static {
//       implement(this, EqualityConcept, { equals(other) { ... } })
//     }
//   }
// Here the pojo { equals(other) { ... } } is converted into
// an Extensions type via ExtensionsReflect.define() internally.

// Abstract membeers can be defined via Extensions by using
// the @kingjs/abstract package and @kingjs/extend. For example:
//   import { abstract } from '@kingjs/abstract'
//   class MyClass {
//     static {
//       extend(this, { method: abstract })
//     }
//   }
// Here the abstract descriptor is copied onto MyClass.prototype
// via an Extensions type created internally by extend().

// The transformation from pojo to Extensions allows for some slick
// declarative patterns for defining members. For example, a method 
// can be defined like this:
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

export class Extensions extends PartialType { }

export class ExtensionsReflect {
  static define(pojoOrType) {
    if (!isPojo(pojoOrType)) return pojoOrType
    return Define.type(pojoOrType, Extensions)
  }
}