import { assert } from '@kingjs/assert'
import { 
  PartialClass, 
  PartialClassReflect,
  AnonymousPartialClass, 
  OwnDeclarationSymbols,
} from '@kingjs/partial-class'
import { isPojo } from '@kingjs/pojo-test'
import { Reflection } from '@kingjs/reflection'

export const Extensions = Symbol('Extensions')

const {
  isExtensionOf,
} = Reflection

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends Extension. For example, an extension 
// could define a dump method that dumps the instance to the console. A type 
// could be dynamically extended with the Dumpper extension like this:
//    import { Extension } from '@kingjs/extension'
//    class MyType { }
//    class Dumpper extends Extension { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

export class Extension extends PartialClass {
  static [OwnDeclarationSymbols] = {
    [Extensions]: { 
      expectedType: [Extension, AnonymousPartialClass],
      map: Extension.fromArg,
    }
  }

  static fromArg(arg) {
    if (isPojo(arg))
      arg = AnonymousPartialClass.create(arg)

    assert(isExtensionOf(arg, PartialClass),
      `Expected arg to be a PartialClass.`)

    return arg
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
    yield* PartialClassReflect.memberKeys(type) 
  }
  static *ownMemberKeys(type) { 
    yield* PartialClassReflect.ownMemberKeys(type) 
  }
}

export function extend(type, ...partials) {

  // for each extension, compile and bind its members to the type prototype
  for (const partial of partials)
    PartialClassReflect.mergeMembers(type, 
      Extension.fromArg(partial))
}
