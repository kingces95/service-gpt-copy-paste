import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
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
  SetAssociativeContainerPart,
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
    compose(this, ContainerPart, { }, {
      get isEmpty() { },
    })

    compose(this, ClearableContainerPart, {
      clear() { this._set.clear() },
    })

    compose(this, SizedContainerPart, {
      get size() { return this._set.size },
    })

    compose(this, AssociativeContainerPart, {
      contains(key) { return this._set.has(key) },
      erase(key) { this._set.delete(key) },
    })
    
    compose(this, SetAssociativeContainerPart, {
      insert(key) { this._set.add(key) },
    })
  }
}
