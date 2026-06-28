// PartialType + compose is Object.defineProperties with richer descriptors.

// Adjacent is a static symbol applied to extensions of
// PartialType which describes how those extensions form a poset of
// PartialType types.

//    export const Adjacent = Symbol('PartialType.adjacent')

// For example, Adjacent is used by PartialClass to designate
// which PartialType families can be adjacent. Each family supplies its own
// declaration symbol through its Declarative metadata.

//    class PartialClass extends PartialType {
//      static [Adjacent] = [ PartialClass, Attachments ]
//    }

// The simplest use of the Composes symbol is to apply an Attachments
// type expressed as a POJO. A single extension can exist as a single
// element of an array or unwrapped like this:

//    class MyExtension extends PartialClass {
//      static [Defines] = {
//        myMethod() { ... }
//        myOtherMethod() { ... }
//      }
//    }

// The Composes symbol can contain an array of member collections like this:

//    class MyMethodGroup extends PartialClass {
//      myMethod() { ... }
//    }
//    class MyExtension extends PartialClass {
//      static [Composes] = [
//        MyMethodGroup,
//        { myOtherMethod() { ... } },
//      ]
//    }

// The Composes declaration can then be merged into a type using compose
// like so:

//    class MyType { }
//    compose(MyType, MyExtension)

// Now MyType.prototype has myMethod and myOtherMethod defined on it.

// Compile is a static symbol applied to extensions of PartialType which
// designates a function that can be used to "compile" member descriptors.
// export const Compile = Symbol('PartialType.compile')

// For example, Concept PartialType uses Compile to transform its
// descriptors so thay are "abstract" by setting all get/set/value to abstract
// for non-data members. Compile is called with the descriptor and returns
// a descriptor:

//    import { abstract } from '@kingjs/abstract'
//    class Concept extends PartialType {
//      static [Compile](descriptor) {
//        const result = super[Compile](descriptor)
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
//    compose(MyType, EqualityConcept)

// Now MyType.prototype has an abstract equals method defined on it.

// The EqualityConcept could define an extension member ThrowIfNotEqual
// that uses equals to throw if two instances are not equal:

//   class EqualityConcept extends Concept {
//     static [Defines] = {
//       throwIfNotEqual(other) {
//         if (!this.equals(other)) throw 'Not equal'
//       }
//     }
//     equals(other) { }
//   }

export const Adjacent = Symbol('PartialType.declarations')
export const Compile = Symbol('PartialType.compile')
export const Normalize = Symbol('PartialType.Normalize')
export const Declarative = Symbol('PartialType.Declarative')
export const Procedural = Symbol('PartialType.Procedural')
export const Redeclare = Symbol('PartialType.Redeclare')
export const Transparent = Symbol('PartialType.Transparent')
export const Implementation = Symbol('PartialType.Implementation')
export const Precondition = Symbol('PartialType.Precondition')
export const Signature = Symbol('PartialType.Signature')

export const CreateThunk = Symbol('PartialProxy.CreateThunk')
export const Preconditions = Symbol('PartialProxy.Preconditions')
export const Postconditions = Symbol('PartialProxy.Postconditions')
export const TypeChecks = Symbol('PartialProxy.TypeChecks')
export const ThisChecks = Symbol('PartialProxy.ThisChecks')
export const ArgChecks = Symbol('PartialProxy.ArgChecks')
export const Defaults = Symbol('PartialProxy.Defaults')
export const Transforms = Symbol('PartialProxy.Transforms')
export const TypePrecondition = Symbol('PartialProxy.TypePrecondition')
export const TypePostcondition = Symbol('PartialProxy.TypePostcondition')
export const PartPrecondition = Symbol('PartialClass.PartPrecondition')
export const Fields = Symbol('PartialClass.Fields')
export const Initializer = Symbol('PartialClass.Initializer')

export const Implements = Symbol('Concept.Implements')
export const Includes = Symbol('Shape.Includes')
export const Composes = Symbol('PartialClass.Composes')
export const Defines = Symbol('Attachments.Defines')
export const DefinesAbstract = Symbol('Attachments.DefinesAbstract')
export const Procedurals = Symbol('PartialType.Procedurals')
export const Implementations = Symbol('PartialType.Implementations')

export function isTransparent(type) {
  return !!type[Transparent]
}

export function isImplementation(type) {
  return !!type[Implementation]
}
