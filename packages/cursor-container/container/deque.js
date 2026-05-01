import Denque from "denque"
import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  OutputRangeConcept,
  RandomAccessRangeConcept,
} from '@kingjs/cursor'
import {
  ContainerPart,
  ClearableContainerPart,
  FrontEditableContainerPart,
  BackEditableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
} from '../container-parts.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import {
  PartialIndexableContainer,
} from '../partial/partial-indexable-container.js'

export class Deque extends PartialProxy {
  static cursorType = IndexableCursor

  _denque
  
  constructor() { 
    super()
    this._denque = new Denque()
  }
  
  static {
    implement(this, RandomAccessRangeConcept)
    implement(this, OutputRangeConcept)
    
    extend(this, PartialIndexableContainer)

    extend(this, ContainerPart, {
      get isEmpty() { return this._denque.isEmpty() },
    })

    extend(this, ClearableContainerPart, {
      clear() { this._denque.clear() },
    })

    extend(this, FrontEditableContainerPart, {
      shift() { return this._denque.shift() },
      unshift(value) { this._denque.unshift(value) },
    })
    
    extend(this, BackEditableContainerPart, {
      push(value) { this._denque.push(value) },
      pop() { return this._denque.pop() },
    })

    extend(this, SizedContainerPart, {
      get count() { return this._denque.length },
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this._denque.get(index) },
      setAt(index, offset, value) { throwNotSupported() },
    })
  }
}
