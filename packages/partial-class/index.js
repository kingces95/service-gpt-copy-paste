import assert from 'assert'
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

export const Extensions = Symbol('Extensions')
export const Compile = Symbol('Compile')
export const Bind = Symbol('Bind')
export const Mark = Symbol('Mark')
export const PostCondition = Symbol('PostCondition')

export class PartialClass {
  static fromPojo(pojo, ExtendedClass = PartialClass) {
    assert(isPojo(pojo))

    // define an anonymous partial class
    const anonymousPartialClass = class extends ExtendedClass { }
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

// Extensions is a getter that returns another partial type or null. In this
// way, a partial type can be the head of a chain of partial types all of
// which are implemented on the type prototype.

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
    const names = memberNamesAndSymbols(partialTypePrototype)
    for (const name of names) {
      const definition = getDescriptor(partialTypePrototype, name)
      const descriptor = partialType[Compile](Compiler.compile(definition))
      const boundDescriptor = partialType[Bind](type, name, descriptor)
      if (!boundDescriptor) continue
      Object.defineProperty(typePrototype, name, boundDescriptor)
    }

    const extensions = partialType[Extensions]
    if (extensions) 
      extend(type, extensions)

    if (partialType[Mark]) partialType[Mark](type)
    if (partialType[PostCondition]) partialType[PostCondition](type)
  }
}
