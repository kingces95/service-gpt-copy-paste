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
  BulkEditableContainerPart,
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
    extend(this, SizedContainerPart, {
      get size() { return this._denque.length },
    })

    extend(this, IndexableContainerPart, {
      at(index) { return this._denque.get(index) },
      setAt(index, offset, value) { throwNotSupported() },
    })

    extend(this, BulkEditableContainerPart, {
      resizeTo(count, value = undefined) {
        if (count < this.size) {
          this._denque.remove(count, this.size - count)
          return this
        }

        while (this.size < count)
          this._denque.push(value)

        return this
      },

      assignRange(range) {
        range = this.sourceRange$(range)

        this.clear()
        return this.insertRange(this.begin(), range)
      },
      
      insertRange(cursor, range) {
        this._denque.splice(cursor.index, 0, ...range)
        return this
      },

      eraseRange(first, last) {
        const result = first.clone()
        this._denque.remove(first.index, last.index - first.index)
        return result
      },
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
  }
}
