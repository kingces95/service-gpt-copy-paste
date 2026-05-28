import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import { EquatableConcept } from '@kingjs/partial-concept'

// Capability declarations.
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
} from './cursor-concept.js'

// Checked/debug parts.
import {
  BacktrackableCursorPart,
  CloneableCursorPart,
  ComparableToCursorPart,
  CursorPart,
  MeasurableCursorPart,
  MovableCursorPart,
  ReadableAtCursorPart,
  ReadableCursorPart,
  SpannableCursorPart,
  SteppableCursorPart,
  WritableAtCursorPart,
  WritableCursorPart,
} from './cursor-parts.js'

// Range declaration.
import {
  RangeConcept,
} from './range-concepts.js'

// Trivial implementations.
import {
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
} from './throw.js'

// Part fixtures mirror cursor-parts.js.
// * = inheritance context, not part of this role.
//
// TrivialCursor
// └─ TrivialSteppableCursor
//    ├─ TrivialReadableCursor
//    │  ├─ TrivialReadableAtCursor
//    │  └─ TrivialInputCursor *
//    │     └─ ...
//    ├─ TrivialWritableCursor
//    │  ├─ TrivialWritableAtCursor
//    │  └─ TrivialOutputCursor *
//    ├─ TrivialCloneableCursor
//    │  └─ TrivialSpannableCursor
//    └─ TrivialBacktrackableCursor
//       └─ TrivialMovableCursor
//          ├─ TrivialComparableToCursor
//          └─ TrivialMeasurableCursor

export class TrivialCursor extends PartialProxy {
  #range

  constructor(range) {
    super()
    this.#range = range
  }

  get range() { return this.#range }

  static {
    implement(this, CursorConcept, {
      step() { throwMoveOutOfBounds() }
    })
    implement(this, EquatableConcept, {
      equals(other) { return this.equatableTo(other) }
    })
  }

  static {
    extend(this, CursorPart)
  }
}

export class TrivialSteppableCursor extends TrivialCursor {
  static {
    implement(this, SteppableCursorConcept, {
      step() { throwMoveOutOfBounds() }
    })
  }

  static {
    extend(this, SteppableCursorPart)
  }
}

export class TrivialReadableCursor extends TrivialSteppableCursor {
  static {
    implement(this, ReadableCursorConcept, {
      get value() { }
    })
  }

  static {
    extend(this, ReadableCursorPart)
  }
}

export class TrivialWritableCursor extends TrivialSteppableCursor {
  static {
    implement(this, WritableCursorConcept, {
      set value(value) { }
    })
  }

  static {
    extend(this, WritableCursorPart)
  }
}

export class TrivialCloneableCursor extends TrivialSteppableCursor {
  static {
    implement(this, CloneableCursorConcept, {
      clone() { return new this.constructor(this.range) }
    })
  }

  static {
    extend(this, CloneableCursorPart)
  }
}

export class TrivialBacktrackableCursor extends TrivialSteppableCursor {
  static {
    implement(this, BacktrackableCursorConcept, {
      stepBack() { throwMoveOutOfBounds() }
    })
  }

  static {
    extend(this, BacktrackableCursorPart)
  }
}

export class TrivialMovableCursor extends TrivialBacktrackableCursor {
  get index() { return 0 }

  static {
    implement(this, MovableCursorConcept, {
      move(offset) {
        if (offset === 0) return this
        throwMoveOutOfBounds()
      },
    })
  }

  static {
    extend(this, MovableCursorPart, {
      canMove$(offset) { return offset === 0 }
    })
  }
}

export class TrivialComparableToCursor extends TrivialMovableCursor {
  static {
    implement(this, ComparableToCursorConcept, {
      compareTo(other) { return 0 },
    })
  }

  static {
    extend(this, ComparableToCursorPart)
  }
}

export class TrivialMeasurableCursor extends TrivialMovableCursor {
  static {
    implement(this, MeasurableCursorConcept, {
      distanceTo(other) { return 0 },
    })
  }

  static {
    extend(this, MeasurableCursorPart)
  }
}

export class TrivialReadableAtCursor extends TrivialReadableCursor {
  get index() { return 0 }

  static {
    implement(this, CloneableCursorConcept, {
      clone() { return new this.constructor(this.range) }
    })

    implement(this, BacktrackableCursorConcept, {
      stepBack() { throwMoveOutOfBounds() }
    })

    implement(this, MovableCursorConcept, {
      move(offset) {
        if (offset === 0) return this
        throwMoveOutOfBounds()
      },
    })

    implement(this, ReadableAtCursorConcept, {
      at(offset) { throwReadOutOfBounds() },
    })
  }

  static {
    extend(this, CloneableCursorPart)
    extend(this, BacktrackableCursorPart)
    extend(this, MovableCursorPart, {
      canMove$(offset) { return offset === 0 }
    })
    extend(this, ReadableAtCursorPart)
  }
}

export class TrivialWritableAtCursor extends TrivialWritableCursor {
  get index() { return 0 }

  static {
    implement(this, CloneableCursorConcept, {
      clone() { return new this.constructor(this.range) }
    })

    implement(this, BacktrackableCursorConcept, {
      stepBack() { throwMoveOutOfBounds() }
    })

    implement(this, MovableCursorConcept, {
      move(offset) {
        if (offset === 0) return this
        throwMoveOutOfBounds()
      },
    })

    implement(this, WritableAtCursorConcept, {
      setAt(offset, value) { },
    })
  }

  static {
    extend(this, CloneableCursorPart)
    extend(this, BacktrackableCursorPart)
    extend(this, MovableCursorPart, {
      canMove$(offset) { return offset === 0 }
    })
    extend(this, WritableAtCursorPart)
  }
}

export class TrivialSpannableCursor extends TrivialCloneableCursor {
  static {
    implement(this, SpannableCursorConcept, {
      get spanType() { return Buffer },
      span(other) { return Buffer.alloc(0) }
    })
  }

  static {
    extend(this, SpannableCursorPart)
  }
}

// Shape/category fixtures preserve the existing range-test vocabulary.
// * = inheritance context, not part of this role.
//
// TrivialCursor *
// └─ TrivialSteppableCursor *
//    ├─ TrivialReadableCursor *
//    │  ├─ TrivialInputCursor
//    │  └─ TrivialForwardCursor
//    │     └─ TrivialBidirectionalCursor
//    │        └─ TrivialRandomAccessCursor
//    │           └─ TrivialWritableRandomAccessCursor
//    │              └─ TrivialContiguousCursor
//    └─ TrivialWritableCursor *
//       └─ TrivialOutputCursor

export class TrivialInputCursor extends TrivialReadableCursor { }
export class TrivialOutputCursor extends TrivialWritableCursor { }

export class TrivialForwardCursor extends TrivialReadableCursor {
  static {
    implement(this, WritableCursorConcept, {
      set value(value) { },
    })

    implement(this, CloneableCursorConcept, {
      clone() { return new this.constructor(this.range) }
    })
  }

  static {
    extend(this, ReadableCursorPart)
    extend(this, WritableCursorPart)
    extend(this, CloneableCursorPart)
  }
}

export class TrivialBidirectionalCursor extends TrivialForwardCursor {
  static {
    implement(this, BacktrackableCursorConcept, {
      stepBack() { throwMoveOutOfBounds() }
    })
  }

  static {
    extend(this, BacktrackableCursorPart)
  }
}

export class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
  get index() { return 0 }

  static {
    implement(this, MovableCursorConcept, {
      move(offset) {
        if (offset === 0) return this
        throwMoveOutOfBounds()
      },
    })

    implement(this, MeasurableCursorConcept, {
      distanceTo(other) { return 0 },
    })

    implement(this, ComparableToCursorConcept, {
      compareTo(other) { return 0 },
    })

    implement(this, ReadableAtCursorConcept, {
      at(offset) { throwReadOutOfBounds() },
    })
  }

  static {
    extend(this, MovableCursorPart)
    extend(this, ComparableToCursorPart)
    extend(this, MeasurableCursorPart)
  }
}

export class TrivialWritableRandomAccessCursor extends TrivialRandomAccessCursor {
  static {
    implement(this, WritableAtCursorConcept, {
      setAt(offset, value) { },
    })
  }

  static {
    extend(this, CloneableCursorPart)
    extend(this, WritableAtCursorPart)
  }
}

export class TrivialContiguousCursor extends TrivialWritableRandomAccessCursor {
  static {
    implement(this, SpannableCursorConcept, {
      get spanType() { return Buffer },
      span(other) { return Buffer.alloc(0) }
    })
  }

  static {
    extend(this, SpannableCursorPart)
  }
}

export class TrivialOtherCursor extends TrivialCursor { }

// Range fixtures bind trivial cursor types to begin/end for the test harness.

export class TrivialRange extends PartialProxy {
  static cursorType = TrivialCursor

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this) },
      end() { return new this.cursorType(this) },
    })
  }
}
export class TrivialOtherRange extends TrivialRange {
  static cursorType = TrivialOtherCursor
}
export class TrivialSteppableRange extends TrivialRange {
  static cursorType = TrivialSteppableCursor
}
export class TrivialReadableRange extends TrivialRange {
  static cursorType = TrivialReadableCursor
}
export class TrivialWritableRange extends TrivialRange {
  static cursorType = TrivialWritableCursor
}
export class TrivialCloneableRange extends TrivialRange {
  static cursorType = TrivialCloneableCursor
}
export class TrivialBacktrackableRange extends TrivialRange {
  static cursorType = TrivialBacktrackableCursor
}
export class TrivialMovableRange extends TrivialRange {
  static cursorType = TrivialMovableCursor
}
export class TrivialComparableToRange extends TrivialRange {
  static cursorType = TrivialComparableToCursor
}
export class TrivialMeasurableRange extends TrivialRange {
  static cursorType = TrivialMeasurableCursor
}
export class TrivialReadableAtRange extends TrivialRange {
  static cursorType = TrivialReadableAtCursor
}
export class TrivialWritableAtRange extends TrivialRange {
  static cursorType = TrivialWritableAtCursor
}
export class TrivialSpannableRange extends TrivialRange {
  static cursorType = TrivialSpannableCursor
}
export class TrivialInputRange extends TrivialRange {
  static cursorType = TrivialInputCursor
}
export class TrivialOutputRange extends TrivialRange {
  static cursorType = TrivialOutputCursor
}
export class TrivialForwardRange extends TrivialRange {
  static cursorType = TrivialForwardCursor
}
export class TrivialBidirectionalRange extends TrivialRange {
  static cursorType = TrivialBidirectionalCursor
}
export class TrivialRandomAccessRange extends TrivialRange {
  static cursorType = TrivialRandomAccessCursor
}
export class TrivialWritableRandomAccessRange extends TrivialRange {
  static cursorType = TrivialWritableRandomAccessCursor
}
export class TrivialContiguousRange extends TrivialRange {
  static cursorType = TrivialContiguousCursor
}
