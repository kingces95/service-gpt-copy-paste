import { abstractify } from '@kingjs/abstract'
import { Descriptor } from '@kingjs/descriptor'
import { PartialType} from '@kingjs/partial-type'
import { 
  Transparent,
  Compile 
} from '@kingjs/partial-symbols'

// Attachments hosts descriptors that can be copied onto a type.

// An Attachments merged with a type is not associated with the 
// type like a PartialClass or Concept. After being copied
// the descriptors are indistinguishable from descriptors which
// might have been defined directly on the type. For this reason, 
// Attachments are said to be "transparent". 

// Attachments are typically created dynamically from a pojo by
// calling PartialLoader.load(pojo). Practically, this
// call is made transparently when loading declarative metadata
// that hosts pojos representing attachments. For example, an
// CursorConcept might define a next() method like this:
//   class CursorConcept extends Concept {
//     static [Defines] = { next() { ... } }
//     ...
//   }
// Here the pojo { next() { ... } } is converted into an Attachments
// type via PartialLoader.load() internally. The next() method is
// then copied onto the prototype of any type that implements CursorConcept.

// Implementing concepts using @kingjs/partial-implement uses 
// PartialLoader.load() internally to convert pojos
// into Attachments types. For example to implement an equality
// concept using a pojo:
//   class MyClass {
//     static {
//       implement(this, EqualityConcept, { equals(other) { ... } })
//     }
//   }
// Here the pojo { equals(other) { ... } } is converted into
// an Attachments type via PartialLoader.load() internally.

// Abstract membeers can be defined via Attachments by using
// the @kingjs/abstract package and @kingjs/partial-define. For example:
//   import { abstract } from '@kingjs/abstract'
//   class MyClass {
//     static {
//       define(this, { method: abstract })
//     }
//   }
// Here the abstract descriptor is copied onto MyClass.prototype
// via an Attachments type created internally by define(). This can
// also be done using implement() like this:
//   class MyClass {
//     static {
//       implement(this, { method() { } })
//     }
//   }

// The transformation from pojo to Attachments allows for some slick
// declarative patterns for defining members. For example, a method 
// can be defined like this:
//    const MyPartial = PartialLoader.load({
//      myMethod() { ... }
//    }) 

// The method could also be defined using a descriptor:
//    const MyPartial = PartialLoader.load({
//      myMethod: { value: function() { ... } }
//    })

// Or as a lambda:
//    const MyPartial = PartialLoader.load({
//      myMethod: () => { ... }
//    })

// Or using a named function like 'abstract':
//    import { abstract } from '@kingjs/abstract'
//    const MyPartial = PartialLoader.load({
//      myMethod: abstract
//    })

// An accessor can be defined like this:
//    const MyPartial = PartialLoader.load({
//      get myProperty() { ... },
//      set myProperty(value) { ... },
//    })

// A constant can be defined like this:
//    const MyPartial = PartialLoader.load({
//      myConstant: { 
//        value: 42, 
//        enumerable: true, 
//        configurable: false, 
//        writable: false 
//      }
//    })

export class Attachments extends PartialType { 
  static [Transparent] = true
}

export class AbstractAttachments extends PartialType {
  static [Transparent] = true
  
  // static [Compile] = Concept[Compile]
  static [Compile](descriptor) {

    // pipeline
    descriptor = super[Compile](descriptor)
    descriptor = Descriptor.cover(descriptor, this.prototype)
    descriptor = abstractify(descriptor)
    return descriptor
  }
}
