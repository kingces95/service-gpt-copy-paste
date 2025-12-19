import { Info } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"
import {
  MyBaseConcept,
  MyLeftConcept,
  MyRightConcept,
  MyConcept,
  MyBasePartialClass,
  MyPartialClass,
  MyBase,
  MyEmptyClass,
  MyClass
} from "./my-classes.js"

function dump(fn) {
  const fnInfo = Info.from(fn)
  fnInfo.dump({
    ownOnly: false,
    filter: [{ 
      isKnown: false,
      isNonPublic: false,
    }],
  })
}

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
dump(MyConcept)

// dump(MyEmptyClass)
// dump(MyBase)
// dump(MyClass)
