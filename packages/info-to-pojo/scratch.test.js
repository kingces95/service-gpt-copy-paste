import { Info } from "@kingjs/info"
import { abstract } from "@kingjs/abstract"
import { PartialClass, Extensions } from "@kingjs/extension-group"
import { extend } from "@kingjs/extend"
import { Concept, Concepts, implement } from "@kingjs/concept"
import { } from "@kingjs/info-to-pojo"
import { PartialObject } from "@kingjs/partial-object"
import { TransparentPartialClass } from "@kingjs/transparent-partial-class"

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

class MyBaseExtensionClass extends PartialClass {
  myBaseExtensionMethod() { }
  myNewExtensionMethod() { }
}

class MyExtensionClass extends PartialClass {
  static [Extensions] = MyBaseExtensionClass
  myNewExtensionMethod() { }
  myExtensionMethod() { }
}

class MyExtensionGroup extends PartialClass {
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

// dump(PartialObject)
// dump(PartialClass)
// dump(Concept)
// dump(TransparentPartialClass)

// dump(MyPartialClass)
// dump(MyExtensionClass)
// dump(MyBaseConcept)
// dump(MyLeftConcept)
// dump(MyConcept)
// dump(MyEmptyClass)
// dump(MyBase)
// dump(MyClass)
