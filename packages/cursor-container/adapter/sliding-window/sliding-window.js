import { Container } from "../../helpers/container.js"

// A sliding window, as the name implies, is a container that provides
// a sliding window of elements. 
// 
// The end of the window is advanced by pushing chunks of elements. 
// What constitutes a chunk is left to the implementation (e.g. an array, 
// a string, a buffer, etc.). 
// 
// Chunks nor elements can be null or undefined. In pracitce, only 
// ObjectSlidingWindow can have null elements, as the other implementations 
// have element primitive types.
// 
// The start of the window is advanced by shifting elements from the 
// container up to but excluding a given cursor. 
// 
// Shifted elements are returned as a array of chunks (e.g. an array of 
// strings, an array of buffers, etc.). Arrays are flattend; If a chunk 
// is an array, then the result of a shift operation will be a single array 
// containing all the elements in the window up to but excluding the cursor 
// instead of an array of arrays of elements. Similarly, chunks that are 
// "empty" are not included in the result of a shift operation (e.g. an array 
// containing an empty buffer is normalized to an empty array).
// 
// How the elements are chunked is left to the implementation but in all 
// cases the order of the elements is preserved. Typically, the same
// chunks that were passed are returned except for the first and last 
// chunks which may be memory efficient views of the first and last chunks
// trimmed to return just the elements implied by the supplied cursor.
// 
// Cursors of sliding windows allow for traversal and retreival of 
// elements in the window (e.g. array elements, code-points, bytes, etc.).
// Cursors are invalidated when the window is popped. Cursors are 
// not invalidated when a new chunk is pushed to the window. Specifically,
// the end cursor will point to the first element of the new chunk
// after a push operation (assuming the chunk is not empty) otherwise
// will return null. Cursors are required to be BidirectionalCursor.
export class SlidingWindow extends Container {
  // static get Cursor() { return IterableCursor }

  // composes a SequenceContainer
  // containers operate on chunks; push/shifted arrays/buffers
  // iterators operate on elements; step/stepBack objects/bytes 

  constructor() {
    super()
  }

  push(value) { 
    if (value === null) 
      throw new Error("Cannot push null to a SlidingWindow.")
    if (value === undefined)
      throw new Error("Cannot push undefined to a SlidingWindow.")
  }
  shift(cursor) { 
    this.__bumpVersion$()
  }
}
