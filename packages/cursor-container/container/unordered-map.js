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
  MapAssociativeContainerPartOf,
} from '../container-parts.js'
import {
  IteratorCursor
} from '../cursor/iterator-cursor.js'

class MapCursor extends IteratorCursor {
  constructor(range, map) {
    assert(map instanceof Map)
    super(range, map)
  }

  get key$() { return this.value[0] }
}

export const UnorderedMapOf = genericType([Function, Function],
(
  TKey = Object,
  TMapped = Object,
) => {
  const EmptyMap = new Map()

  return class UnorderedMap extends PartialProxy {
    static cursorType = MapCursor
    static keyType = TKey
    static mappedType = TMapped
    static valueType = Array

    _map

    constructor() {
      super()
      this._map = new Map()
    }

    static {
      implement(this, RangeConcept, {
        begin() { return new this.cursorType(this, this._map) },
        end() { return new this.cursorType(this, EmptyMap) }
      })
    }

    static {
      compose(this, ClearableContainerPart, {
        clear() { this._map.clear() },
      })

      compose(this, SizedContainerPart, {
        get size() { return this._map.size },
      })

      compose(this, AssociativeContainerPartOf(TKey), {
        contains(key) { return this._map.has(key) },
        erase(key) { return this._map.delete(key) },
      })

      compose(this, MapAssociativeContainerPartOf(TKey, TMapped), {
        at(key) { return this._map.get(key) },
        insertOrAssign(key, value) {
          return this._map.set(key, value)
        },
      })
    }
  }
})
