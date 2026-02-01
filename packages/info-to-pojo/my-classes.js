import { abstract } from "@kingjs/abstract"
import { PartialClass, Extends } from "@kingjs/partial-class"
import { extend } from "@kingjs/partial-extend"
import { implement } from "@kingjs/implement"
import { Concept, Implements } from "@kingjs/concept"

const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export class MyBaseConcept extends Concept { 
  myBaseConceptMethod() { } 
}
export class MyLeftConcept extends Concept { 
  static [Implements] = MyBaseConcept
  myLeftConceptMethod() { } 
  myAmbidextrousMethod() { }
}
export class MyRightConcept extends Concept {
  static [Implements] = MyBaseConcept
  myRightConceptMethod() { } 
  myAmbidextrousMethod() { }
}
export class MyConcept extends Concept {
  static [Implements] = [ MyLeftConcept, MyRightConcept ]
  myConceptMethod() { }
}

export class MyBasePartialClass extends PartialClass {
  myBaseMethod() { }
  myNewMethod() { }
}

export class MyPartialClass extends PartialClass {
  static [Extends] = MyBasePartialClass
  myNewMethod() { }
  myMethod() { }
}

export class MyBase {
  static { 
    implement(this, MyConcept, { 
      myConceptMethod() { },
      myBaseConceptMethod() { }
    }) 
  }
  static myStaticBaseMethod() { }
  myBaseMethod() { }
}

export class MyEmptyClass { }

export class MyClass extends MyBase {
  static { 
    extend(this, MyPartialClass) 
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
