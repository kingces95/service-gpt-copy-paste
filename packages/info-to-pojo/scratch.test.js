import { Info } from "@kingjs/info"
import { abstract } from "@kingjs/abstract"
import { ExtensionGroup, Extensions } from "@kingjs/extension-group"
import { extend } from "@kingjs/extend"
import { Concept, Concepts, implement } from "@kingjs/concept"
import { } from "@kingjs/info-to-pojo"
import { MemberCollection } from "@kingjs/member-collection"
import { PartialClass } from "@kingjs/partial-class"

const MySymbol = Symbol('my-symbol')
const MyStaticSymbol = Symbol('my-static-symbol')

class MyBaseConcept extends Concept { 
  myBaseConceptMethod() { } 
}
class MyLeftConcept extends Concept { 
  static [Concepts] = MyBaseConcept
  myLeftConceptMethod() { } 
  myAmbidextrousMethod() { }
}
class MyRightConcept extends Concept {
  static [Concepts] = MyBaseConcept
  myRightConceptMethod() { } 
  myAmbidextrousMethod() { }
}
class MyConcept extends Concept {
  static [Concepts] = [ MyLeftConcept, MyRightConcept ]
  myConceptMethod() { }
}

class MyBaseExtensionClass extends ExtensionGroup {
  myBaseExtensionMethod() { }
  myNewExtensionMethod() { }
}

class MyExtensionClass extends ExtensionGroup {
  static [Extensions] = MyBaseExtensionClass
  myNewExtensionMethod() { }
  myExtensionMethod() { }
}

class MyExtensionGroup extends ExtensionGroup {
  static [Extensions] = MyExtensionClass
  myPartialMethod() { }
}

class MyBase {
  static { 
    implement(this, MyConcept, { 
      myConceptMethod() { },
      myBaseConceptMethod() { }
    }) 
  }
  static myStaticBaseMethod() { }
  myBaseMethod() { }
}

class MyEmptyClass { }

class MyClass extends MyBase {
  static { 
    extend(this, MyExtensionGroup) 
  }

  static get myStaticAccessor() { }
  static set myStaticAccessor(value) { }
  static myStaticMethod() { }
  static _myStaticMethod() { }
  
  get myAccessor() { }
  set myAccessor(value) { }
  myMethod() { }
  _myMethod() { }
  myAbstractMethod() { }
  myConceptMethod() { }

  [MySymbol]() { }
  static [MyStaticSymbol]() { }
}

// attach abstract method to MyClass
Object.defineProperty(MyClass.prototype, 'myAbstractMethod', {
  value: abstract,
  writable: true,
  enumerable: false,
  configurable: true,
})

function dump(fn) {
  const fnInfo = Info.from(fn)
  fnInfo.dump({
    ownOnly: false,
    filter: [{ 
      // isStatic: true,
      // isKnown: false,
      // isNonPublic: false,
    }],
  })
}

const myBasePrototype = MyBase.prototype

// dump(Function)
// dump(Object)

// dump(MemberCollection)
// dump(ExtensionGroup)
// dump(Concept)
// dump(PartialClass)

// dump(MyPartialClass)
// dump(MyExtensionClass)
// dump(MyBaseConcept)
// dump(MyLeftConcept)
// dump(MyConcept)
// dump(MyEmptyClass)
// dump(MyBase)
// dump(MyClass)
