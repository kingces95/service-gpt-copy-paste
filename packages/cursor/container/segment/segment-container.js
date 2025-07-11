import { Container } from '../container.js'
import { Vector } from '../sequence/rewind/indexable/vector.js'
import { Deque } from '../sequence/rewind/indexable/deque.js'
import { JoinView } from '../../view/join-view.js'
import { SegmentCursor } from './segment-cursor.js'

// SegmentContainer is a container that holds segments of data, where each
// segment is a Range or View. Segments are joined when iterated over. 
// Segments are interned (e.g. pushed or unshifted) one by one. Segments are 
// evicted (e.g. popped or shifted) as a sub-sequence of the order they were
// interned, in whole or in part, up to, but excluding, a specified cursor, as
// ranges. Once a all elements of a segment are evicted, the segment is
// removed from the container.  

// For example, segments [0] and [1, 2, 3] could be interned as follows:
// - push([0]) // segments = [[0]]
// - push([1, 2]) // segments = [[0], [1, 2, 3]]
// The segments are then iterated over as a sequence of elements:
// - begin() // cursor points to the first element, which is 0
// - end() // cursor points to one past the last element, which is 3
// Segments can be evicted given a cursor pointing at 3:
// - popMany(cursor) // returns [[0], [1, 2]]
// The first segment is fully evicted and available for garbage collection
// as soon as the client no longer holds a reference to it. The second segment
// is "split" into two logical parts using Range. The first range is returned 
// and the second range is kept in the container. Since the second segment is 
// not fully evicted, it is not available for garbage collection so long as the
// container is alive.

// SegmentContainer is implemented as a composition of a Deque and a JoinView.
// It uses the Deque to store segments and the JoinView to iterate over them.
// Segments are passed by the client as an Interval (e.g. Range, View, or
// Container). Each Interval is converted to a Range before being pushed into 
// the Deque. The JoinView is used to iterate over the segments in the Deque.
// Segments are evicted upto, but excluding, a specified cursor from the
// beginning or end of the sequence, returning a collection of segments
// (Ranges) that were evicted as a vector or deque respectively.

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
export class SegmentContainer extends Container {
  #sequence
  #joinView

  constructor(sequenceType) {
    super(SegmentCursor)

    const sequence = new sequenceType()
    const joinView = new JoinView(sequence)
    super(joinView.cursorType)

    this.#sequence = sequence
    this.#joinView = joinView
  }

  begin$(recyclable) { return this.#joinView.begin$(recyclable) }
  end$(recyclable) { return this.#joinView.end$(recyclable) }
  data$(cursor) { return this.#joinView.data$(cursor) }

  push(segment) { this.#sequence.push(segment.toRange()) }
  unshift(segment) { this.#sequence.unshift(segment.toRange()) }

  dispose$() {
    this.#joinView.dispose()
    this.#sequence.dispose()
  }

  // return elements after the cursor as a collection of segments
  popMany(cursor) {
    const result = new Deque()
    const sequence = this.#sequence
    const [ 
      { value: segment }, 
      segmentCursor
    ] = this.data(cursor)

    // return full segments after the cursor
    let segment$ = sequence.back
    for (; segment$ != segment; segment$ = sequence.back) 
      result.unshift(sequence.pop())

    // split the segment containing the cursor
    const [ front, back ] = segment.split(segmentCursor)

    // return the back part of the segment that contained the cursor
    result.unshift(back)

    // keep the front part of the segment that contains the cursor
    segment.end = front.end
    
    return result
  }

  // return elements before the cursor as a collection of segments 
  shiftMany(cursor) {
    const result = new Vector() 
    const sequence = this.#sequence
    const [ 
      { value: segment }, 
      segmentCursor
    ] = this.data(cursor)

    // return full segments before the cursor
    let segment$ = sequence.front
    for (; segment$ != segment; segment$ = sequence.front) 
      result.push(sequence.shift())

    // split the segment containing the cursor
    const [ front, back ] = segment.split(segmentCursor)

    // return the front part of the segment that contained the cursor
    result.push(front)

    // keep the back part of the segment that contains the cursor
    segment.begin = back.begin
    
    return result
  }
}
