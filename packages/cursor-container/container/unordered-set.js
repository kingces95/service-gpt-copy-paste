import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { define } from '@kingjs/partial-define'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  RangeConcept,
} from '@kingjs/cursor'
import {
  ContainerPart,
  ClearableContainerPart,
  SizedContainerPart,
  AssociativeContainerPart,
  UnorderedSetContainerPart,
} from '../container-parts.js'
import {
  IteratorCursor
} from '../cursor/iterator-cursor.js'

const EmptySet = new Set()

class SetCursor extends IteratorCursor {
  constructor(range, set) {
    assert(set instanceof Set)
    super(range, set)
  }
}

export class UnorderedSet extends PartialProxy {
  static cursorType = SetCursor
  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, this._set) },
      end() { return new this.cursorType(this, EmptySet) }
    })
  }

  _set

  constructor() { 
    super()
    this._set = new Set()
  }

  static {
    extend(this, ContainerPart, {
      insert(value) { this.add(value) },
      erase({ at = this.begin() } = { }) { this.remove(at.value) },
    })

    extend(this, ClearableContainerPart, {
      clear() { this._set.clear() },
    })

    extend(this, SizedContainerPart, {
      get size() { return this._set.size },
    })

    extend(this, AssociativeContainerPart, {
      has(key) { return this._set.has(key) },
      remove(key) { this._set.delete(key) },
    })
    
    extend(this, UnorderedSetContainerPart, {
      add(key) { this._set.add(key) },
    })
  }
}
