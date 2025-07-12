export function throwUnsupported() { throw new Error(
  'Operation requires advanced cursor type.') }
export function throwNotImplemented() { throw new Error(
  'Not implemented.') }

export function throwNull() { throw new TypeError(
  'Cursor cannot be null or undefined.') }
export function throwNotEquatableTo() { throw new TypeError(
  'Cursor is not equatable to the other cursor.') }

export function throwReadOnly() { throw new Error(
  'Cursor is read-only.') }

export function throwNotInput() { throw new Error(
  'Operation requires an input cursor.') }
export function throwNotOutput() { throw new Error(
  'Operation requires an output cursor.') }
export function throwNotForward() { throw new Error(
  'Operation requires a forward cursor.') }
export function throwNotBidirectional() { throw new Error(
  'Operation requires a bidirectional cursor.') }
export function throwNotRandomAccess() { throw new Error(
  'Operation requires a random access cursor.') }
export function throwNotContiguous() { throw new Error(
  'Operation requires a contiguous cursor.') }

export function throwUnequatable() { throw new TypeError(
  'Cannot compare cursors of a sequence container that is not equatable.') }
export function throwWriteOutOfBounds() { throw new RangeError(
  'Cannot write value out of bounds of cursor.') }
export function throwMoveOutOfBounds() { throw new RangeError(
  'Cannot move cursor out of bounds.') }