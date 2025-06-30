import { Container } from '../container.js'
import { SequenceCursor } from '../sequence-cursor.js'

// Sequence container is an abstract class (ala stl) that represents
// a sequence of elements. It is the base class for all sequence containers
// such as Vector, Deque, and List. It provides a common interface for
// iterating over the elements in the sequence. It is not meant to be
// instantiated directly, but rather to be extended by other classes.

// Operations:
// - begin: Returns a cursor pointing to the first element in the sequence.
// - end: Returns a cursor pointing to one past the last element in the sequence.
// - count: Returns the number of elements in the sequence.
// - distance: Returns the number of elements between two cursors.
// - at: Returns the element at a specified index in the sequence.
// - isEmpty: Returns true if the sequence is empty, false otherwise.
// - push/unshift: Add element to start/end of the sequence.
// - pop/shift: Remove element from start/end of the sequence up to but
//   excluding a specified cursor.
export class SequenceContainer extends Container {
  static get Cursor() { return SequenceCursor }

  constructor() {
    super()
  }

  get isEmpty() { return this.count === 0 }
  get count() { throw new Error("Not implemented.") }

  at(index) { throw new Error("Not implemented.") }
  push(value) { throw new Error("Not implemented.") }
  unshift(value) { throw new Error("Not implemented.") }
  pop(cursor) { throw new Error("Not implemented.") }
  shift(cursor) { throw new Error("Not implemented.") }
  set(index, value) { throw new Error("Not implemented.") }

  begin(recyclable) {
    return super.begin(recyclable, 0)
  }
  end(recyclable) {
    return super.end(recyclable, this.count)
  }
  distance(begin, end) {
    this.__throwIfDisposed$()
    return end.subtract(begin)
  }
  dispose() {
    this.__throwIfDisposed$()
    super.dispose()
  }
}
