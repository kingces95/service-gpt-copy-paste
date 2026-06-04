import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { genericType } from '@kingjs/generic'
import {
  RangeConcept,
} from '@kingjs/cursor'
import {
  ClearableContainerPart,
  SizedContainerPart,
  AssociativeContainerPartOf,
  SetAssociativeContainerPartOf,
} from '../container-parts.js'
import {
  IteratorCursor
} from '../cursor/iterator-cursor.js'

class SetCursor extends IteratorCursor {
  constructor(range, set) {
    assert(set instanceof Set)
    super(range, set)
  }
}

export const UnorderedSetOf = genericType([Function],
(
  TKey = Object,
) => {
  const EmptySet = new Set()

  return class UnorderedSet extends PartialProxy {
    static cursorType = SetCursor
    static keyType = TKey
    static valueType = TKey

    _set

    constructor() {
      super()
      this._set = new Set()
    }

    static {
      implement(this, RangeConcept, {
        begin() { return new this.cursorType(this, this._set) },
        end() { return new this.cursorType(this, EmptySet) }
      })
    }

    static {
      compose(this, ClearableContainerPart, {
        clear() { this._set.clear() },
      })

      compose(this, SizedContainerPart, {
        get size() { return this._set.size },
      })

      compose(this, AssociativeContainerPartOf(TKey), {
        contains(key) { return this._set.has(key) },
        erase(key) { this._set.delete(key) },
      })

      compose(this, SetAssociativeContainerPartOf(TKey), {
        insert(key) { this._set.add(key) },
      })
    }
  }
})
