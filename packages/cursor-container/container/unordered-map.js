import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  RangeConcept,
} from '@kingjs/cursor'
import {
  ClearableContainerPart,
  SizedContainerPart,

  AssociativeContainerPart,
  MapAssociativeContainerPart,
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

const EmptyMap = new Map()

export class UnorderedMap extends PartialProxy {
    static cursorType = MapCursor
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

      compose(this, AssociativeContainerPart, {
        contains(key) { return this._map.has(key) },
        erase(key) { return this._map.delete(key) },
      })

      compose(this, MapAssociativeContainerPart, {
        at(key) { return this._map.get(key) },
        insertOrAssign(key, value) {
          return this._map.set(key, value)
        },
      })
  }
}
