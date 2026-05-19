import { implement } from '@kingjs/partial-implement'
import { Preconditions } from '@kingjs/partial-proxy'
import { PartialProxy } from '@kingjs/partial-proxy'
import { EquatableConcept } from '@kingjs/partial-concept'
import { Cursor } from './cursor.js'
import { 
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  OffsetReadableCursorConcept,
  OffsetWritableCursorConcept,
  ContiguousCursorConcept,
} from './cursor-concepts.js'
import { 
  RangeConcept
} from './range-concepts.js'
import {
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from './throw.js'
import { distance } from '../cursor-algorithm/distance.js'

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
}

export class TrivialInputCursor extends TrivialCursor {
  static [Preconditions] = {
    get value() { throwReadOutOfBounds() }
  }

  static { 
    implement(this, InputCursorConcept, {
      get value() { }
    }) 
  }
}

export class TrivialOutputCursor extends TrivialCursor {
  static [Preconditions] = {
    set value(value) { throwWriteOutOfBounds() }
  }

  static { 
    implement(this, OutputCursorConcept, {
      set value(value) { }
    }) 
  }
}

export class TrivialMutableCursor extends TrivialCursor {
  static [Preconditions] = {
    get value() { throwReadOutOfBounds() },
    set value(value) { throwWriteOutOfBounds() }
  }

  static {
    implement(this, MutableCursorConcept, {
      get value() { },
      set value(value) { },
    })
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
}

export class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
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
}

export class TrivialOffsetReadableCursor extends TrivialRandomAccessCursor {
  static {
    implement(this, OffsetReadableCursorConcept, {
      at(offset) { },
    })
  }
}

export class TrivialOffsetWritableCursor extends TrivialRandomAccessCursor {
  static {
    implement(this, OffsetWritableCursorConcept, {
      setAt(offset, value) { },
    })
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
}

export class TrivialContiguousCursor extends TrivialOffsetCursor {
  static { 
    implement(this, ContiguousCursorConcept, {
      span(other) { return Buffer.alloc(0) }
    }) 
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
