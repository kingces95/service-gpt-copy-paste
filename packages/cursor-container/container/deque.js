import Denque from "denque"
import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  FrontEditableContainerConcept,
  BackEditableContainerConcept,
  SizedContainerConcept,
  IndexableContainerConcept,
  OutputContainerConcept,
  RandomAccessContainerConcept,
} from '../container-concepts.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'

const {
  partialContainerType$: PartialIndexableContainer,
} = IndexableCursor

export class Deque extends PartialProxy {
  static cursorType = IndexableCursor

  _denque
  
  constructor() { 
    super()
    this._denque = new Denque()
  }
  
  dispose$() { this._denque.clear() }

  static {
    extend(this, PartialIndexableContainer)

    implement(this, RandomAccessContainerConcept)
    implement(this, OutputContainerConcept)

    implement(this, FrontEditableContainerConcept, {
      shift() { return this._denque.shift() },
      unshift(value) { this._denque.unshift(value) },
    })
    
    implement(this, BackEditableContainerConcept, {
      push(value) { this._denque.push(value) },
      pop() { return this._denque.pop() },
    })

    implement(this, SizedContainerConcept, {
      get count() { return this._denque.length },
    })

    implement(this, IndexableContainerConcept, {
      at(index) { return this._denque.get(index) },
      setAt(index, offset, value) { throwNotSupported() },
    })
  }
}
