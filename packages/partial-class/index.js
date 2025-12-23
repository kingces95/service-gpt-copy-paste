import { PartialObject } from '@kingjs/partial-object'
import { PartialPojo } from '@kingjs/partial-pojo'
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

export class PartialClass extends PartialObject {
  static [PartialObject.OwnCollectionSymbols] = {
    [Extends]: { 
      expectedType: [ PartialClass, PartialPojo ],
      map: PartialReflect.defineType,
    }
  }
}

export class PartialClassReflect {
  static isPartialClass(type) {
    const collectionType = PartialReflect.getPartialObjectType(type)
    return collectionType == PartialClass
  }

  static *partialClasses(type) {
    for (const collection of PartialReflect.partialObjects(type)) {
      const collectionType = PartialReflect.getPartialObjectType(collection)
      if (collectionType != PartialClass) continue
      yield collection
    }
  }
  static *ownPartialClasses(type) {
    for (const collection of PartialReflect.ownPartialObjects(type)) {
      if (!PartialClassReflect.isPartialClass(collection)) continue 
      yield collection
    }
  }
  static getPartialClass(type, name) {
    const host = PartialReflect.getHost(type, name)
    if (!PartialClassReflect.isPartialClass(host)) return null
    return host
  }
}