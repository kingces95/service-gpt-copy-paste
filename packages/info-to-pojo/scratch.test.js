import { Info } from "@kingjs/info"
import { filterInfoPojo } from "@kingjs/info-to-pojo"
import { dumpPojo } from "@kingjs/pojo-dump"
import { abstract } from "@kingjs/abstract"
import { PartialClass, Parts } from "@kingjs/partial-class"
import { load } from "@kingjs/loader"
import { extend } from "@kingjs/extend"
import { Concept, Concepts, implement } from "@kingjs/concept"

const MySymbol = Symbol('my-symbol')
const MyStaticSymbol = Symbol('my-static-symbol')

class MyBaseConcept extends Concept { myBaseConceptMethod() { } }
class MyLeftConcept extends Concept { 
  static [Parts] = MyBaseConcept
  myLeftConceptMethod() { } 
  myAmbidextrousMethod() { }
}
class MyRightConcept extends Concept {
  static [Parts] = MyBaseConcept
  myRightConceptMethod() { } 
  myAmbidextrousMethod() { }
}
class MyConcept extends Concept {
  static [Parts] = [MyLeftConcept, MyRightConcept]
  myConceptMethod() { }
}

class MyBaseExtensionClass extends PartialClass {
  myBaseExtensionMethod() { }
  myNewExtensionMethod() { }
}

class MyExtensionClass extends PartialClass {
  static [Parts] = MyBaseExtensionClass
  myNewExtensionMethod() { }
  myExtensionMethod() { }
}

class MyPartialClass extends PartialClass {
  static [Parts] = MyExtensionClass
  myPartialMethod() { }
}

class MyBase {
  [Concepts] = MyConcept
  static { load(this) }

  static { 
    implement(this, MyConcept, { 
      myConceptMethod() { },
      myBaseConceptMethod() { }
    }) 
  }
  static myStaticBaseMethod() { }
  myBaseMethod() { }
}

class MyClass extends MyBase {
  static { extend(this, MyPartialClass) }
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
Object.defineProperty(MyBase.prototype, 'myAbstractMethod', {
  value: abstract,
  writable: true,
  enumerable: false,
  configurable: true,
})

function filter(pojo) {
  return filterInfoPojo(pojo, {
    includeInstance: {
      isInherited: true,
      isSymbol: true,
      // isKnown: true,
    },
    includeStatic: {
      isInherited: true,
      // isKnown: true,
      // isSymbol: true,
    }
  })
}

function dump(fn) {
  const fnInfo = Info.from(fn)
  fnInfo.__toPojo().then(pojo => { 
    pojo = filter(pojo)
    dumpPojo(pojo)
  })
}

dump(Function)
dump(Object)
dump(Concept)
dump(PartialClass)
dump(MyConcept)
dump(MyPartialClass)
dump(MyExtensionClass)
dump(MyBase)
dump(MyClass)
