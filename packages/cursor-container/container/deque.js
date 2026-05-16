import Denque from "denque"
import { assert } from '@kingjs/assert'
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
import { 
  IndexableCursor 
} from '../cursor/indexable-cursor.js'

const Fixed = { fixed: true }

export class Deque extends PartialProxy {
  static cursorType = IndexableCursor
  static {
    implement(this, OutputRangeConcept)
    implement(this, RandomAccessRangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })  
  }

  _denque
  
  constructor() { 
    super()
    this._denque = new Denque()
  }
  
  static {
    extend(this, ContainerPart, {
      get isEmpty() { return this._denque.isEmpty() },
      insert(value, { at = this.begin(Fixed) } = { }) {
        assert(this.end(Fixed).equals(at) 
          || this.begin(Fixed).equals(at),
          `Invalid cursor: ${at}. Must be at the beginning or end of the deque.`)

        if (this.end(Fixed).equals(at)) 
          return this._denque.push(value)
        else
          return this._denque.unshift(value)
      },
      erase({ at = this.begin(Fixed) } = { }) {
        assert(this.end(Fixed).equals(at) 
          || this.begin(Fixed).equals(at),
          `Invalid cursor: ${at}. Must be at the beginning or end of the deque.`)

        if (this.end(Fixed).equals(at))
          return this._denque.pop()
        else
          return this._denque.shift()
      }
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
      get size() { return this._denque.length },
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this._denque.get(index) },
      setAt(index, offset, value) { throwNotSupported() },
    })
  }
}
