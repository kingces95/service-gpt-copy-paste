import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { define } from '@kingjs/partial-define'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  CursorConcept,
  RangeConcept,
  InputRangeConcept,

  throwNull,
  throwUpdateOutOfBounds,
  throwNotEquatableTo,
} from '@kingjs/cursor'
import {
  ContainerPart,
  ClearableContainerPart,
  SizedContainerPart,

  AssociativeContainerPart,
  UnorderedMapContainerPart,
} from '../container-parts.js'
import {
  IteratorCursor
} from '../cursor/iterator-cursor.js'

const EmptyMap = new Map()

class MapCursor extends IteratorCursor {
  constructor(range, map) {
    assert(map instanceof Map)
    super(range, map)
  }

  static {
    define(this, {
      get key() { return this.value[0] },
    })
  }
}

export class UnorderedMap extends PartialProxy {
  static cursorType = MapCursor
  static {
    implement(this, InputRangeConcept, {
      begin() { return new this.cursorType(this, this._map) },
      end() { return new this.cursorType(this, EmptyMap) }
    })
  }

  _map

  constructor() { 
    super()
    this._map = new Map()
  }

  static {
    extend(this, ContainerPart, {
      insert(value) { this.add(value[0], value[1]) },
      erase({ at = this.begin() } = { }) { this.remove(at.value[0]) },
    })

    extend(this, ClearableContainerPart, {
      clear() { this._map.clear() },
    })

    extend(this, SizedContainerPart, {
      get size() { return this._map.size },
    })

    extend(this, AssociativeContainerPart, {
      has(key) { return this._map.has(key) },
      remove(key) { this._map.delete(key) },
    })
    
    extend(this, UnorderedMapContainerPart, {
      get(key) { return this._map.get(key) },
      add(key, value) { this._map.set(key, value) },
    })
  }
}
