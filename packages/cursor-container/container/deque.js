import Denque from "denque"
import { contract } from '@kingjs/function-contract'
import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  RangeConcept,
} from '@kingjs/cursor'
import {
  ContainerPart,
  ClearableContainerPart,
  FrontInsertableContainerPart,
  BackInsertableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  EditableContainerPart,
  BulkAssignableContainerPart,
  BulkEditableContainerPart,
  sourceRange,
} from '../container-parts.js'
import { 
  IndexableCursor 
} from '../cursor/indexable-cursor.js'
import { iterate, next } from '@kingjs/cursor-algorithm'

export class Deque extends PartialProxy {
  static cursorType = IndexableCursor
  static {
    implement(this, RangeConcept, {
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
      setAt(index, value) { this._denque.splice(index, 1, value) },
    })

    extend(this, BulkAssignableContainerPart, {
      resize(count, value = undefined) {
        if (count < this.size) {
          this._denque.remove(count, this.size - count)
          return this
        }

        while (this.size < count)
          this._denque.push(value)

        return this
      },

      assignRange: contract({
        transforms: [sourceRange],
      },
      function assignRange(range) {
        this.clear()
        return this.insertRange(this.begin(), range)
      }),
    })

    extend(this, BulkEditableContainerPart, {
      insertRange: contract({
        transforms: [null, sourceRange],
      },
      function insertRange(cursor, range) {
        this._denque.splice(cursor.index, 0, ...iterate(range))
        return this
      }),
    })

    extend(this, EditableContainerPart, {
      erase(first, last = next(first)) {
        const result = first.clone()
        this._denque.remove(first.index, last.index - first.index)
        return result
      },
    })

    extend(this, ClearableContainerPart, {
      clear() { this._denque.clear() },
    })

    extend(this, FrontInsertableContainerPart, {
      popFront() { return this._denque.shift() },
      pushFront(value) { this._denque.unshift(value) },
    })

    extend(this, BackInsertableContainerPart, {
      pushBack(value) { this._denque.push(value) },
      popBack() { return this._denque.pop() },
    })
  }
}
