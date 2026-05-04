import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { extend } from '@kingjs/partial-extend'
import { List } from './list.js'
import { 
  BidirectionalCursorConcept, 
  BidirectionalRangeConcept 
} from '@kingjs/cursor'
import { 
  ContainerPart,
  SizedContainerPart,
  BackEditableContainerPart,
  SpliceableContainerPart,
  EditableContainerPart,
} from '../container-parts.js'
import {
  RewindLink,
} from '../link/rewind-link.js'

class ChainCursor extends List.cursorType {
  static linkType$ = RewindLink

  constructor(container, link) {
    super(container, link)
  }

  static { 
    implement(this, BidirectionalCursorConcept, {
      stepBack() {
        this.link = this.link.previous
        assert(this.link)
        return this
      }    
    }) 
  }
}

export class Chain extends List {
  static cursorType = ChainCursor
  
  _count

  constructor() {
    super()
    this._count = 0
  }

  static {
    implement(this, BidirectionalRangeConcept)

    define(this, {
      // TODO: Loader installs stubs so type.prototype does not work. Need
      // to update loader to attach a static [Prototype] symbol that contains
      // the original methods so super methods can be addressed stripped of
      // stubs and proxies. OR make the proxies detect a super call and forward
      // to the original method.

      // insertAfter(value, cursor) { cursor.link.insertAfter(value) },
      // eraseAfter(cursor) { return cursor.link.eraseAfter() },

      insertAfter(value, cursor) {
        // List.prototype.insertAfter.call(this, value, cursor)
        cursor.link.insertAfter(value)
        this._count++
      },
      eraseAfter(cursor) {
        // const result = List.prototype.eraseAfter.call(this, cursor)
        const result = cursor.link.eraseAfter()
        this._count--
        return result
      },
    })

    extend(this, ContainerPart, {
      insert(value, { after = this.beforeBegin() }) {
        this.insertAfter(value, after)
      },
    })

    extend(this, BackEditableContainerPart, {
      get back() { return this.endLink$.previous.value },
      push(value) { 
        this.insertAt(value, this.end())
      },
      pop() {
        const cursor = this.end()
        cursor.stepBack()
        const result = cursor.value
        this.erase(cursor)
        return result
      },
    })

    extend(this, SizedContainerPart, {
      get size() { return this._count },
    })

    extend(this, EditableContainerPart, {
      insertAt(value, cursor) {
        cursor.link.insert(value)
        this._count++
      },
      eraseAt(cursor) {
        const result = cursor.clone().step()
        cursor.link.erase()
        this._count--
        return result
      }
    })

    extend(this, SpliceableContainerPart, {
      splice(cursor, outCount = 0, ...values) {
        const beforeCursor = cursor.clone().stepBack()
        while (outCount-- > 0) this.eraseAfter(beforeCursor)
        for (let i = values.length - 1; i >= 0; i--)
          this.insertAfter(values[i], beforeCursor)
      },
    })
  }
}
