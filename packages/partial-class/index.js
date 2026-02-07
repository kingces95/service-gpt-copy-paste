import { PartialType, PartialTypeReflect } from '@kingjs/partial-type'
import { Extensions } from '@kingjs/extensions'
import { PartialReflect } from '@kingjs/partial-reflect'

export const Extends = Symbol('PartialClass.Extends')

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends PartialClass. For example, an extension 
// could define a dump method that dumps the instance to the console. A type 
// could be dynamically extended with the Dumpper extension like this:
//    import { PartialClass } from '@kingjs/partial-class'
//    class MyType { }
//    class Dumpper extends PartialClass { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

export class PartialClass extends PartialType {
  static [PartialType.PartialTypes] = {
    [Extends]: { 
      expectedType: [ PartialClass, Extensions ],
      map: PartialReflect.load,
    }
  }
}

export class PartialClassReflect {
  static isPartialClass(type) {
    if (!type) return false
    const collectionType = PartialTypeReflect.getPartialType(type)
    return collectionType == PartialClass
  }

  static *partialClasses(type) {
    for (const collection of PartialReflect.partialExtensions(type)) {
      const collectionType = 
        PartialTypeReflect.getPartialType(collection)
      if (collectionType != PartialClass) continue
      yield collection
    }
  }
  static *ownPartialClasses(type) {
    for (const collection of PartialReflect.ownPartialExtensions(type)) {
      if (!PartialClassReflect.isPartialClass(collection)) continue 
      yield collection
    }
  }
  static getPartialClass(type, name) {
    const host = PartialReflect.getHost(type, name)
    if (!PartialClassReflect.isPartialClass(host)) return null
    if (type == host) return null
    return host
  }
}