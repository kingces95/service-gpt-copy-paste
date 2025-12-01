import { MemberCollection } from '@kingjs/member-collection'
import { PartialClass } from '@kingjs/partial-class'

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
