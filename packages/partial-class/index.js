import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { Compiler } from '@kingjs/compiler'

const {
  get: getDescriptor,
} = Descriptor

const {
  memberNamesAndSymbols,
} = Reflection

export const Extensions = Symbol('PartialClassExtensions')
export const Compile = Symbol('PartialClassCompile')
export const Bind = Symbol('PartialClassBind')
export const Mark = Symbol('PartialClassMark')
export const PostCondition = Symbol('PartialClassPostCondition')
export const Keys = Symbol('PartialClassKeys')

export class PartialClass {
  static fromPojo(pojo, ExtendedClass = PartialClass) {
    assert(isPojo(pojo))

    // define an anonymous partial class
    const [anonymousPartialClass] = [class extends ExtendedClass { }]
    const prototype = anonymousPartialClass.prototype
    
    // copy descriptors from pojo to anonymous partial class prototype
    for (const name of memberNamesAndSymbols(pojo)) {
      const descriptor = getDescriptor(pojo, name)
      Object.defineProperty(prototype, name, descriptor)
    }

    return anonymousPartialClass
  }

  constructor() {
    throw new TypeError('PartialClass cannot be instantiated.')
  }

  static [Extensions] = null
  static [Compile](descriptor) { return descriptor }
  static [Bind](type, name, descriptor) { return descriptor }
  static [Mark](type) { }
  static [PostCondition](type) { }
  static *[Keys](prototype) { yield* memberNamesAndSymbols(prototype) }
}

// Extend copies members from one or more partial types to a type prototype.
// A partial class is a class which extends PartialClass and has members
// that conform to the Compiler DSL. For example, a partial class could
// define a dump method that dumps the instance to the console and then
// any type could be dynamically extended with the Dumpper partial class:
//    require 'implment' from '@kingjs/partial-class'
//    class MyType { }
//    class Dumpper extends PartialClass { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

// A partial class could also be implemented as a POJO with concise syntax.
//    const Dumpper = { dump: { value: () => console.log(this) } }
// In this case, the POJO is converted to an anonymous partial class
// before being implemented on the type prototype. See PartialClass.fromPojo.

// A partial type can also define a number of static hooks. Each hook has its 
// own symbol: Extensions, Compile, Bind, Mark, and PostCondition.  

// Extensions is a static member that returns another an array of partial
// types (or a single partial type or null). In this way, a partial type 
// can be the head of a tree of partial types all of which are implemented 
// on the type prototype. Specifically, if Concept is a partial type, then
// Concept[Extensions] can contain other concepts and so provide a way for
// a concept to be composed from other concepts.

// Keys is a generator that returns the names and symbols of the members
// to be copied to the target type prototype. The default implementation
// returns all names and symbols. A partial type can override this behavior
// to filter and/or extend the list of members to be copied.

// Compile allows the client to apply custom policy to the descriptors
// after they have been compiled by Compiler. For example, a concept
// partial type can apply a policy that all its members are "abstract" by
// setting all get/set/value to abstract for non-data members. Compile is 
// called with the descriptor and returns a descriptor.

// Bind allows the client to apply custom policy to the compiled descriptors. 
// Bind is called with the type, name, and descriptor and returns a descriptor 
// or null to skip the descriptor. 

// Mark allows the client apply custom policy to the type after all members
// have been defined. For example, a concept partial type can add itself
// to a ConceptSet on the type. Mark is called with the type and returns void.

// PostCondition allows the client to enforce a post condition after the
// partial type as been applied. This is not guaranteed to be called if
// a non-debug version of the code is used. PostCondition is called with
// the type and returns void.
export function extend(type, ...partialTypes) {

  // for each partial type, compile and bind its members to the type prototype
  for (let partialType of partialTypes) {
    if (!partialType) continue

    // if pojo, create anonymous partial class from pojo
    if (isPojo(partialType))
      partialType = PartialClass.fromPojo(partialType)

    if (!(partialType.prototype instanceof PartialClass)) throw new TypeError(
    'Expected partial type to extend PartialClass.')

    // fetch, compile, bind, and define properties on the type prototype
    const typePrototype = type.prototype
    const partialTypePrototype = partialType.prototype
    for (const key of partialType[Keys](partialTypePrototype)) {
      const definition = getDescriptor(partialTypePrototype, key)
      const descriptor = partialType[Compile](Compiler.compile(definition))
      const boundDescriptor = partialType[Bind](type, key, descriptor)
      if (!boundDescriptor) continue
      Object.defineProperty(typePrototype, key, boundDescriptor)
    }

    // extend with tree of extensions
    const extensions = partialType[Extensions]
    extend(type, ...(Array.isArray(extensions) ? extensions : [extensions]))

    if (partialType[Mark]) partialType[Mark](type)
    if (partialType[PostCondition]) partialType[PostCondition](type)
  }
}
