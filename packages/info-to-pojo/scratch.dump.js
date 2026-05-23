import { ClassInfo } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"
import {
  BidirectionalCursorShape,
  ContiguousCursorShape,
  CursorShape,
  ForwardCursorShape,
  InputCursorShape,
  OutputCursorShape,
  RandomAccessCursorShape,
  WritableContiguousCursorShape,
  WritableRandomAccessCursorShape,
} from "@kingjs/cursor-shape"
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
// dump(Attachments)

// dump(MyPartialClass)
// dump(MyExtensionClass)
// dump(MyBaseConcept)
// dump(MyLeftConcept)
// dump(MyConcept)

// dump(MyEmptyClass)
dump(MyBase)
// dump(MyClass)

// dump(CursorShape)
// dump(InputCursorShape)
// dump(OutputCursorShape)
// dump(ForwardCursorShape)
// dump(BidirectionalCursorShape)
// dump(RandomAccessCursorShape)
// dump(WritableRandomAccessCursorShape)
// dump(ContiguousCursorShape)
// dump(WritableContiguousCursorShape)
