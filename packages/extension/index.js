import { assert } from '@kingjs/assert'
import { PartialClass, PartialClassReflect } from '@kingjs/partial-class'
import { isPojo } from '@kingjs/pojo-test'
import { Descriptor } from '@kingjs/descriptor'
import { Reflection } from '@kingjs/reflection'

export const Extensions = Symbol('Extensions')

const {
  get: getDescriptor,
} = Descriptor

const {
  isExtensionOf,
  ownMemberNamesAndSymbols,
} = Reflection

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends Extension. For example, an extension 
// could define a dump method that dumps the instance to the console. A type 
// could be dynamically extended with the Dumpper extension like this:
//    import { Extension } from '@kingjs/extension'
//    class MyType { }
//    class Dumpper extends Extension { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

// Extend also accepts POJO with concise syntax. The POJO is converted into
// an Extension.
//    const Dumpper = { dump: { value: () => console.log(this) } }
// In this case, the POJO is converted to an anonymous extension
// before being implemented on the type prototype. See Extension.fromPojo.

export class Extension extends PartialClass {
  static [PartialClass.Symbol.ownDeclaraitionSymbols] = {
    [Extensions]: { 
      expectedType: Extension,
      map: Extension.fromArg,
    }
  }

  static fromArg(arg) {
    if (isPojo(arg))
      arg = Extension.fromPojo(arg)

    assert(isExtensionOf(arg, PartialClass),
      `Expected arg to be a PartialClass.`)

    return arg
  }

  static fromPojo(pojo) {
    assert(isPojo(pojo))

    // define an anonymous extension
    const [anonymousExtension] = [class extends Extension { }]
    const prototype = anonymousExtension.prototype
    
    // copy descriptors from pojo to anonymous extension prototype
    for (const name of ownMemberNamesAndSymbols(pojo)) {
      const descriptor = getDescriptor(pojo, name)
      Object.defineProperty(prototype, name, descriptor)
    }

    return anonymousExtension
  }
}

const Filter = { filterType: Extension }

export class ExtensionReflect {
  static isExtension(type) {
    return PartialClassReflect.getPartialClass(type) == Extension
  }
  static *extensions(type) {
    yield* PartialClassReflect.declarations(type, Filter)
  }
  static *ownExtensions(type) {
    yield* PartialClassReflect.ownDeclarations(type, Filter)
  }
  static *memberKeys(type) { 
    yield* PartialClassReflect.memberKeys(type, Filter) 
  }
  static *ownMemberKeys(type) { 
    yield* PartialClassReflect.ownMemberKeys(type, Filter) 
  }
  static keyLookup(type) {
    return PartialClassReflect.keyLookup(type, Filter)
  }
}