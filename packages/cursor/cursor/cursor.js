// These classes, except for Cursor, are not meant to be instantiated directly,
// but rather act as documentation for the cursor interfaces.

export class Cursor {
  #readOnly = false

  #throwUnsupported() {
    throw new Error('Unsupported operation for this cursor type')
  }

  throwIfReadOnly$() {
    if (this.isReadOnly) throw new Error('Cursor is read-only')
  }

  get isForward() { return this.isBidirectional }
  get isBidirectional() { return this.isIterable }
  get isIterable() { return this.isRandomAccess }
  get isRandomAccess() { return this.isContiguous }
  get isContiguous() { return false }

  get isReadOnly() { return this.#readOnly }
  set isReadOnly(value) {
    if (typeof value !== 'boolean') 
      throw new TypeError('isReadOnly must be a boolean')
    if (this.isReadOnly && !value)
      throw new Error('Cannot change isReadOnly from true to false')
    this.#readOnly = value
  }

  equatable(other) {
    if (!(other instanceof this.constructor)) return false
    return this.isReadOnly === other.isReadOnly
  }

  get isEnd() { }
  get isBegin() { }
  get value() { }
  step() { }
  equals(other) { }

  data(other) { this.#throwUnsupported() }
  next() { this.#throwUnsupported() }
  stepBack() { this.#throwUnsupported() }
  at(offset) { this.#throwUnsupported() }
  subtract(other) { this.#throwUnsupported() }
  compare(other) { this.#throwUnsupported() }

  readUint8() { this.#throwUnsupported() }
  readInt8() { this.#throwUnsupported() }

  readUInt16BE() { this.#throwUnsupported() }
  readInt16BE() { this.#throwUnsupported() }
  readUInt16LE() { this.#throwUnsupported() }
  readInt16LE() { this.#throwUnsupported() }
  
  readUInt32BE() { this.#throwUnsupported() }
  readInt32BE() { this.#throwUnsupported() }
  readUInt32LE() { this.#throwUnsupported() }
  readInt32LE() { this.#throwUnsupported() }

  read(length = 1, signed = false, littleEndian = false) {
    this.#throwUnsupported()
  }
}

export class ForwardCursor extends Cursor {
  // The method `data` returns a node Buffer which underpins the range
  // between the cursor and the other cursor. 
  data(other) { }

  next() { }
}

export class BidirectionalCursor extends ForwardCursor {
  stepBack() { }
}

export class IterableCursor extends BidirectionalCursor {
  next() { return this.step() }
}

export class RandomAccessCursor extends IterableCursor {
  at(offset) { }
  subtract(other) { }
  compare(other) { }
}

export class ContiguousCursor extends IterableCursor {
  readUint8() { }
  readInt8() { }

  readUInt16BE() { }
  readInt16BE() { }
  readUInt16LE() { }
  readInt16LE() { }

  readUInt32BE() { }
  readInt32BE() { }
  readUInt32LE() { }
  readInt32LE() { }

  read(length = 1, signed = false, littleEndian = false) { }
}
