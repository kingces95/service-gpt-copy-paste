import { PartialType, Declarations } from '@kingjs/partial-type'
import { Extensions } from '@kingjs/extensions'
import { Defines, Extends } from '@kingjs/partial-symbols'

export { Extends, Defines } from '@kingjs/partial-symbols'

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends PartialClass. For example, an extension 
// could define a dump method that dumps the instance to the console. A type 
// could be dynamically extended with the Dumpper extension like this:
//    import { PartialClass } from '@kingjs/partial-class'
//    class MyType { }
//    class Dumpper extends PartialClass { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

export class PartialClass extends PartialType {
  static [Declarations] = {
    [Extends]: { 
      expectedType: PartialClass,
    },
    [Defines]: {
      expectedType: Extensions,
    },
  }
}
