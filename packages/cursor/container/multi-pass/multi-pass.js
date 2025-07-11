import { Container } from '../container.js'
import { SegmentContainer } from '../segment/segment-container.js'

import { Container } from '../container.js'
import { Range } from '../../view/range.js'
import { JoinView } from '../../view/join-view.js'
import { Vector } from '../sequence/rewind/indexable/vector.js'
import { Deque } from '../sequence/rewind/indexable/deque.js'

// A multi-pass container is an abstract class that models a stream which does
// not evict data upon reading. Instead it evicts data when client specifies it 
// has consumed the data. This allows the client to read the data multiple times 
// hence the name multi-pass. 

// A multi-pass container is a forward container, meaning that it only
// allows reading data in a forward direction. If the client needs to re-read
// the data, it must anticipate the point to which it might need to return
// and clone and save a cursor to that point.

// The multi-pass container is an adaption of a segment container, which is
// a container the accpets and evects segments of data at a time. A segment
// container can be bidirectional if the segments are bidirectional, but
// a multi-pass restricts this to be forward only.

// Operations:
// - begin: Returns a cursor pointing to the first element in the sequence.
// - end: Returns a cursor pointing to one past the last element in the sequence.
// - isEmpty: Returns true if the sequence is empty, false otherwise.
// - push: Add a range of data to start of the sequence.
// - shift: Evict segments from start of the sequence up to, but excluding, 
//    a specified cursor.

export class MulitPass extends Container {
  static get View() { throw new Error("Not implemented.") }

  #segmentedContainer
  #view

  constructor(ComposedViewType) {
    super()

    this.#segmentedContainer = new SegmentContainer()
    this.#view = new ComposedViewType(this.#segmentedContainer)
  }

  begin$(recyclable) { return this.#view.begin$(recyclable) }
  end$(recyclable) { return this.#view.end$(recyclable) }

  get count() { return this.#segmentedContainer.count }
  get isEmpty() { return this.count === 0 }
  
  // a segment is a Range (accepts View which is converted to Range)
  push(segment) { 
  }

  // return elements before the cursor as a collection of segments 
  shiftMany(cursor, result = new Vector()) { 
  }

  dispose() {
    super.dispose()
    this.#view.dispose()
    this.#segmentedContainer.dispose()
  }
}

