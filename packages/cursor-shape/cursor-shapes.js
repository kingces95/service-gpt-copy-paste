import { Shape, Includes } from '@kingjs/partial-shape'
import { Implements } from '@kingjs/partial-concept'
import {
  BacktrackableCursorConcept,
  CloneableCursorConcept,
  ComparableToCursorConcept,
  CursorConcept,
  MeasurableCursorConcept,
  MovableCursorConcept,
  ReadableAtCursorConcept,
  ReadableCursorConcept,
  SpannableCursorConcept,
  SteppableCursorConcept,
  WritableAtCursorConcept,
  WritableCursorConcept,
} from '@kingjs/cursor'

// Movement/read pivot:
//
// CursorShape
// └─ InputCursorShape
//    └─ ForwardCursorShape
//       └─ BidirectionalCursorShape
//          └─ RandomAccessCursorShape
//             └─ ContiguousCursorShape

export class CursorShape extends Shape {
  static [Implements] = [
    CursorConcept,
    SteppableCursorConcept,
  ]
}

export class InputCursorShape extends Shape {
  static [Includes] = CursorShape
  static [Implements] = ReadableCursorConcept
}

export class ForwardCursorShape extends Shape {
  static [Includes] = InputCursorShape
  static [Implements] = CloneableCursorConcept
}

export class BidirectionalCursorShape extends Shape {
  static [Includes] = ForwardCursorShape
  static [Implements] = BacktrackableCursorConcept
}

export class RandomAccessCursorShape extends Shape {
  static [Includes] = BidirectionalCursorShape
  static [Implements] = [
    MovableCursorConcept,
    ComparableToCursorConcept,
    MeasurableCursorConcept,
    ReadableAtCursorConcept,
  ]
}

export class ContiguousCursorShape extends Shape {
  static [Includes] = RandomAccessCursorShape
  static [Implements] = SpannableCursorConcept
}

// Write pivot:
//
// OutputCursorShape
// └─ WritableRandomAccessCursorShape
//    └─ WritableContiguousCursorShape

export class OutputCursorShape extends Shape {
  static [Includes] = CursorShape
  static [Implements] = WritableCursorConcept
}

export class WritableRandomAccessCursorShape extends Shape {
  static [Includes] = [ OutputCursorShape, RandomAccessCursorShape ]
  static [Implements] = WritableAtCursorConcept
}

export class WritableContiguousCursorShape extends Shape {
  static [Includes] = [
    ContiguousCursorShape,
    WritableRandomAccessCursorShape,
  ]
}
