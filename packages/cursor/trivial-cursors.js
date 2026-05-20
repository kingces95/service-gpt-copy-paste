import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import { EquatableConcept } from '@kingjs/partial-concept'
import { Cursor } from './cursor.js'
import { 
  CursorConcept,
  CursorPart,
  InputCursorConcept,
  InputCursorPart,
  OutputCursorConcept,
  OutputCursorPart,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  BidirectionalCursorPart,
  RandomAccessCursorConcept,
  RandomAccessCursorPart,
  OffsetReadableCursorConcept,
  OffsetReadableCursorPart,
  OffsetWritableCursorConcept,
  OffsetWritableCursorPart,
  ContiguousCursorConcept,
  ContiguousCursorPart,
} from './cursor-concepts.js'
import { 
  RangeConcept
} from './range-concepts.js'
import {
  throwMoveOutOfBounds,
} from './throw.js'

// End cursor implementations; Cursors (1) are empty and (2) cannot move. 

export class TrivialCursor extends Cursor {
  constructor(scope) {
    super(scope)
  }

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

export class TrivialInputCursor extends TrivialCursor {
  static { 
    implement(this, InputCursorConcept, {
      get value() { }
    }) 
  }

  static {
    extend(this, InputCursorPart)
  }
}

export class TrivialOutputCursor extends TrivialCursor {
  static { 
    implement(this, OutputCursorConcept, {
      set value(value) { }
    }) 
  }

  static {
    extend(this, OutputCursorPart)
  }
}

export class TrivialMutableCursor extends TrivialCursor {
  static {
    implement(this, MutableCursorConcept, {
      get value() { },
      set value(value) { },
    })
  }

  static {
    extend(this, InputCursorPart)
    extend(this, OutputCursorPart)
  }
}

export class TrivialForwardCursor extends TrivialMutableCursor {
  static { 
    implement(this, ForwardCursorConcept, {
      clone() { return new this.constructor(this.range) }
    }) 
  }
}

export class TrivialBidirectionalCursor extends TrivialForwardCursor {
  static { 
    implement(this, BidirectionalCursorConcept, {
      stepBack() { throwMoveOutOfBounds() }
    }) 
  }

  static {
    extend(this, BidirectionalCursorPart)
  }
}

export class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
  get index() { return 0 }

  static { 
    implement(this, RandomAccessCursorConcept, {
      move(offset) { 
        if (offset === 0) return this
        throwMoveOutOfBounds()
      },
      distanceTo(other) { return 0 },
      compareTo(other) { return 0 },
    }) 
  }

  static {
    extend(this, RandomAccessCursorPart)
  }
}

export class TrivialOffsetReadableCursor extends TrivialRandomAccessCursor {
  static {
    implement(this, OffsetReadableCursorConcept, {
      at(offset) { },
    })
  }

  static {
    extend(this, OffsetReadableCursorPart)
  }
}

export class TrivialOffsetWritableCursor extends TrivialRandomAccessCursor {
  static {
    implement(this, OffsetWritableCursorConcept, {
      setAt(offset, value) { },
    })
  }

  static {
    extend(this, OffsetWritableCursorPart)
  }
}

export class TrivialOffsetCursor extends TrivialRandomAccessCursor {
  static {
    implement(this, OffsetReadableCursorConcept, {
      at(offset) { },
    })
    implement(this, OffsetWritableCursorConcept, {
      setAt(offset, value) { },
    })
  }

  static {
    extend(this, OffsetReadableCursorPart)
    extend(this, OffsetWritableCursorPart)
  }
}

export class TrivialContiguousCursor extends TrivialOffsetCursor {
  static { 
    implement(this, ContiguousCursorConcept, {
      span(other) { return Buffer.alloc(0) }
    }) 
  }

  static {
    extend(this, ContiguousCursorPart)
  }
}

export class TrivialOtherCursor extends TrivialCursor { }

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
export class TrivialInputRange extends TrivialRange {
  static cursorType = TrivialInputCursor
}
export class TrivialOutputRange extends TrivialRange {
  static cursorType = TrivialOutputCursor
}
export class TrivialMutableRange extends TrivialRange {
  static cursorType = TrivialMutableCursor
}
export class TrivialForwardRanged extends TrivialRange {
  static cursorType = TrivialForwardCursor
}
export class TrivialBidirectionalRange extends TrivialRange {
  static cursorType = TrivialBidirectionalCursor
}
export class TrivialRandomAccessRange extends TrivialRange {
  static cursorType = TrivialRandomAccessCursor
}
export class TrivialOffsetReadableRange extends TrivialRange {
  static cursorType = TrivialOffsetReadableCursor
}
export class TrivialOffsetWritableRange extends TrivialRange {
  static cursorType = TrivialOffsetWritableCursor
}
export class TrivialOffsetRange extends TrivialRange {
  static cursorType = TrivialOffsetCursor
}
export class TrivialContiguousRange extends TrivialRange {
  static cursorType = TrivialContiguousCursor
}
