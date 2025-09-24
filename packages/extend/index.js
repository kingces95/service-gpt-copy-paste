import { PartialClass } from '@kingjs/partial-class'

// Extend copies members from one or more extensions to a type prototype.
// An extension is a class which extends PartialClass. For example, a Extension 
// could define a dump method that dumps the instance to the console and then
// any type could be dynamically extended with the Dumpper partial class:
//    require 'implment' from '@kingjs/extension'
//    class MyType { }
//    class Dumpper extends Extension { dump() { Console.log(this) } }
//    extend(MyType, Dumpper)

// Extend also accepts POJO with concise syntax which will be converted into
// Extension.
//    const Dumpper = { dump: { value: () => console.log(this) } }
// In this case, the POJO is converted to an anonymous partial class
// before being implemented on the type prototype. See Extension.fromPojo.

export function extend(type, ...partials) {

  // for each partial type, compile and bind its members to the type prototype
  for (const partial of partials)
    PartialClass.fromArg(partial).defineOn(type)
}
