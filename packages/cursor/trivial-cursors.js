import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-type'
import { PartialProxy } from '@kingjs/partial-proxy'
import { EquatableConcept } from '@kingjs/concept'
import { Cursor } from './cursor.js'
import { 
  CursorConcept,
  CursorFactoryConcept,
  InputCursorConcept,
  OutputCursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from './cursor-concepts.js'
import {
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
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
}

export class TrivialContainer extends PartialProxy {
  constructor(cursorType) {
    super()
    this._cursorType = cursorType
  }

  static {
    implement(this, CursorFactoryConcept, {
      get cursorType() { return this._cursorType },
      begin() { return new this._cursorType(this) },
      end() { return new this._cursorType(this) },
    })
  }
}
export class TrivialInputContainer extends TrivialContainer {
  constructor() { super(TrivialInputCursor) }
}
export class TrivialOutputContainer extends TrivialContainer {
  constructor() { super(TrivialOutputCursor) }
}
export class TrivialMutableContainer extends TrivialContainer {
  constructor() { super(TrivialMutableCursor) }
}
export class TrivialForwardContainer extends TrivialContainer {
  constructor() { super(TrivialForwardCursor) }
}
export class TrivialBidirectionalContainer extends TrivialContainer {
  constructor() { super(TrivialBidirectionalCursor) }
}
export class TrivialRandomAccessContainer extends TrivialContainer {
  constructor() { super(TrivialRandomAccessCursor) }
}
export class TrivialContiguousContainer extends TrivialContainer {
  constructor() { super(TrivialContiguousCursor) }
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
      clone() { return new this.constructor(this.scope$) }
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
  static [Preconditions] = {
    setAt(offset, value) { throwWriteOutOfBounds() },
    at(offset) { throwReadOutOfBounds() },
  }

  static { 
    implement(this, RandomAccessCursorConcept, {
      move(offset) { 
        if (offset === 0) return this
        throwMoveOutOfBounds()
      },
      at(offset) { },
      setAt(offset, value) { },
      subtract(other) { return 0 },
      compareTo(other) { return 0 },
    }) 
  }
}

export class TrivialContiguousCursor extends TrivialRandomAccessCursor {
  static [Preconditions] = {
    readAt(offset, length, signed, littleEndian) { throwReadOutOfBounds() },
  }

  static { 
    implement(this, ContiguousCursorConcept, {
      readAt(offset = 0, length = 1, signed = false, littleEndian = false) { },
      data(other) { return Buffer.alloc(0) }
    }) 
  }
}

export class OtherTrivialCursor extends TrivialCursor { }

  