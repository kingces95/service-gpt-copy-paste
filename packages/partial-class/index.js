import { PartialObject } from '@kingjs/partial-object'
import { TransparentPartialClass } from '@kingjs/transparent-partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

export const Extensions = Symbol('Extensions')

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
    [Extensions]: { 
      expectedType: [ PartialClass, TransparentPartialClass ],
      map: PartialReflect.defineType,
    }
  }
}

export class PartialClassReflect {
  static isExtensionGroup(type) {
    const collectionType = PartialReflect.getPartialObjectType(type)
    return collectionType == PartialClass
  }

  static *extensionGroups(type) {
    for (const collection of PartialReflect.collections(type)) {
      const collectionType = PartialReflect.getPartialObjectType(collection)
      if (collectionType != PartialClass) continue
      yield collection
    }
  }
  static *ownExtensionGroups(type) {
    for (const collection of PartialReflect.ownCollections(type)) {
      if (!PartialClassReflect.isExtensionGroup(collection)) continue 
      yield collection
    }
  }
  static getExtensionGroup(type, name) {
    const host = PartialReflect.getHost(type, name)
    if (!PartialClassReflect.isExtensionGroup(host)) return null
    return host
  }
}