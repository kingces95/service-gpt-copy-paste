export function throwNotSupported() { throw new Error(
  'Operation is not supported.') }
export function throwNotImplemented() { throw new Error(
  'Not implemented.') }

export function throwNull() { throw new TypeError(
  'Cursor cannot be null or undefined.') }
export function throwNotEquatableTo() { throw new TypeError(
  'Cursor is not an equatable cursor in this context.') }

export function throwStale() { throw new Error(
  'Cursor is stale and cannot be used.') }

export function throwReadOutOfBounds() { throw new RangeError(
  'Cannot read value out of bounds of cursor.') }
export function throwWriteOutOfBounds() { throw new RangeError(
  'Cannot write value out of bounds of cursor.') }
export function throwMoveOutOfBounds() { throw new RangeError(
  'Cannot move cursor out of bounds.') }

export function throwEmpty() { throw new Error(
    "Container is empty.") }
export function throwDisposed() { throw new Error(
    "Container is disposed and cannot be used.") }
export function throwUpdateOutOfBounds() { throw new RangeError(
    "Cannot update container at this location.") }