import { isPojo } from '@kingjs/pojo-test'
import { asArray } from '@kingjs/as-array'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { PartialClass } from '@kingjs/partial-class'

import { Extension,
  Extensions, Compile, Bind, Mark, 
  PreCondition, PostCondition,
} from '@kingjs/extension'

const {
  get: getDescriptor,
} = Descriptor

const {
  memberNamesAndSymbols,
} = Reflection

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends Extension. For example, a PartialClass 
// could define a dump method that dumps the instance to the console and then
// any type could be dynamically extended with the Dumpper partial class:
//    require 'implment' from '@kingjs/partial-class'
//    class MyType { }
//    class Dumpper extends PartialClass { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

// Extend also accepts POJO with concise syntax which will be converted into
// PartialClass.
//    const Dumpper = { dump: { value: () => console.log(this) } }
// In this case, the POJO is converted to an anonymous partial class
// before being implemented on the type prototype. See PartialClass.fromPojo.

// An Extension can also define a number of static hooks. Each hook has its 
// own symbol: Extensions, Compile, Bind, Mark, and PostCondition.  

// Extensions is a static member that returns another an array of Extension
// types (or a single Extension type or null). In this way, an Extension 
// can be the head of a tree of Extensions all of which are implemented 
// on the type prototype. Specifically, if Concept is a partial type, then
// Concept[Extensions] can contain other concepts and so provide a way for
// a concept to be composed from other concepts.

// Compile allows the Extension to apply custom policy to the descriptors
// after they have been compiled by Compiler. For example, a concept
// partial type can apply a policy that all its members are "abstract" by
// setting all get/set/value to abstract for non-data members. Compile is 
// called with the descriptor and returns a descriptor.

// Bind allows the Extension to apply custom policy to the compiled descriptors. 
// Bind is called with the type, name, and descriptor and returns a descriptor. 
// If Bind returns null, then the member is not defined on the type prototype.
// Concept will return null if the member is already defined on the type prototype.

// Mark allows the Extension to apply custom policy to the type after all members
// have been defined. For example, a Concept can add itself to a ConceptSet on 
// the type. Mark is called with the type and returns void.

// PreCondition allows the Extension to enforce a pre condition before any
// members are applied. This is not guaranteed to be called if a non-debug 
// version of the code is used. PreCondition is called with the type 
// and returns void.

// PostCondition allows the Extension to enforce a post condition after the
// partial type as been applied. This is not guaranteed to be called if
// a non-debug version of the code is used. PostCondition is called with
// the type and returns void.
export function extend(type, ...extensions) {

  // for each partial type, compile and bind its members to the type prototype
  for (let extension of extensions) {
    if (!extension) continue
    if (extension === Extension) continue

    // if pojo, create anonymous partial class from pojo
    if (isPojo(extension))
      extension = PartialClass.fromPojo(extension)

    if (!(extension.prototype instanceof Extension)) throw new TypeError(
      'Expected partial type to extend Extension.')

    extension[PreCondition](type)

    // fetch, compile, bind, and define properties on the type prototype
    const typePrototype = type.prototype
    const partialTypePrototype = extension.prototype
    for (const key of memberNamesAndSymbols(partialTypePrototype)) {
      const definition = getDescriptor(partialTypePrototype, key)
      const descriptor = extension[Compile](definition)
      const boundDescriptor = extension[Bind](type, key, descriptor)
      if (!boundDescriptor) continue
      Object.defineProperty(typePrototype, key, boundDescriptor)
    }

    // extend with tree of extensions
    const childExtensions = asArray(extension[Extensions])
    extend(type, ...childExtensions)

    extension[Mark](type)
    extension[PostCondition](type)
  }  
}
