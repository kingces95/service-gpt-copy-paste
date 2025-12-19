import { MemberCollection } from '@kingjs/member-collection'
import { PartialClass } from '@kingjs/partial-class'
import { MemberReflect } from '@kingjs/member-reflect'

export const Extensions = Symbol('Extensions')

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends ExtensionGroup. For example, an extension 
// could define a dump method that dumps the instance to the console. A type 
// could be dynamically extended with the Dumpper extension like this:
//    import { ExtensionGroup } from '@kingjs/extension-group'
//    class MyType { }
//    class Dumpper extends ExtensionGroup { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

export class ExtensionGroup extends MemberCollection {
  static [MemberCollection.OwnCollectionSymbols] = {
    [Extensions]: { 
      expectedType: [ ExtensionGroup, PartialClass ],
      map: PartialClass.fromArg,
    }
  }
}

export class ExtensionGroupReflect {
  static isExtensionGroup(type) {
    const collectionType = MemberReflect.getCollectionType(type)
    return collectionType == ExtensionGroup
  }

  static *extensionGroups(type) {
    for (const collection of MemberReflect.collections(type)) {
      const collectionType = MemberReflect.getCollectionType(collection)
      if (collectionType != ExtensionGroup) continue
      yield collection
    }
  }
  static *ownExtensionGroups(type) {
    for (const collection of MemberReflect.ownCollections(type)) {
      if (!ExtensionGroupReflect.isExtensionGroup(collection)) continue 
      yield collection
    }
  }
  static getExtensionGroup(type, name) {
    const host = MemberReflect.getHost(type, name)
    if (!ExtensionGroupReflect.isExtensionGroup(host)) return null
    return host
  }
}