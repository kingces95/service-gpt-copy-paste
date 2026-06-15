import { EquatableConcept } from '@kingjs/partial-concept'
import { Defines } from '@kingjs/partial-class'

// Cursor concepts are the C#-ish declaration/provenance layer:
//
// CursorConcept
// ├─ SteppableCursorConcept
// │  └─ BacktrackableCursorConcept
// │     └─ MovableCursorConcept
// │        ├─ ComparableToCursorConcept
// │        └─ MeasurableCursorConcept
// ├─ ReadableCursorConcept
// │  └─ ReadableAtCursorConcept
// ├─ WritableCursorConcept
// │  └─ WritableAtCursorConcept
// ├─ CloneableCursorConcept
// └─ SpannableCursorConcept

export class CursorConcept extends EquatableConcept {
  static [Defines] = {
    equatableTo(other) {
      if (other?.constructor != this.constructor) return false
      return this.range == other.range
    },
  }

  get range() { }
  step() { }
}

export class SteppableCursorConcept extends CursorConcept {
  step() { }
}

export class ReadableCursorConcept extends CursorConcept {
  get value() { }
}

export class WritableCursorConcept extends CursorConcept {
  set value(value) { }
}

export class CloneableCursorConcept extends CursorConcept {
  clone() { }
}

export class BacktrackableCursorConcept extends SteppableCursorConcept {
  stepBack() { }
}

export class MovableCursorConcept extends BacktrackableCursorConcept {
  move(offset) { }
}

export class ComparableToCursorConcept extends MovableCursorConcept {
  compareTo(other) { }
}

export class MeasurableCursorConcept extends MovableCursorConcept {
  distanceTo(other) { }
}

export class ReadableAtCursorConcept extends ReadableCursorConcept {
  at(offset) { }
}

export class WritableAtCursorConcept extends WritableCursorConcept {
  setAt(offset, value) { }
}

export class SpannableCursorConcept extends CursorConcept {
  get spanType() { }
  span(range) { }
}
