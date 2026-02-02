import { ClassInfo } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"
import {
  MyExtensions,
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
import { 
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept
} from "@kingjs/cursor"

function dump(fn) {
  const fnInfo = ClassInfo.from(fn)
  fnInfo.dump({
    ownOnly: false,
    isNonPublic: false,
  })
}

// dump(Object)
// dump(Function)

// dump(MyExtensions)

// dump(PartialType)
// dump(PartialClass)
// dump(Concept)
// dump(Extensions)

// dump(MyPartialClass)
// dump(MyExtensionClass)
// dump(MyBaseConcept)
// dump(MyLeftConcept)
// dump(MyConcept)

// dump(MyEmptyClass)
dump(MyBase)
// dump(MyClass)

// dump(CursorConcept)
// dump(InputCursorConcept)
// dump(OutputCursorConcept)
// dump(ForwardCursorConcept)
// dump(BidirectionalCursorConcept)
// dump(RandomAccessCursorConcept)
// dump(ContiguousCursorConcept)