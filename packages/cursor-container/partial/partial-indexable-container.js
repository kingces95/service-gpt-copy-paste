import { implement } from '@kingjs/partial-implement'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  ForwardRangeConcept,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from '@kingjs/cursor'
import {
  ContainerConcept,
  FrontEditableContainerConcept,
  BackEditableContainerConcept,
  EditableContainerConcept,
  SizedContainerConcept,
  IndexableContainerConcept,
} from '../container-concepts.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import { PartialContainer } from './partial-container.js'

const __version = Symbol('__version')

export class PartialIndexableContainer extends PartialContainer {
  static cursorType = IndexableCursor

  static [Preconditions] = {
    shift() { this[__version]++ || 1 },
    unshift(value) { this[__version]++ || 1 },

    at(index) {
      if (index < 0) throwReadOutOfBounds()
      if (index >= this.count) throwReadOutOfBounds()
    },
    setAt(index, value) {
      if (index < 0) throwWriteOutOfBounds()
      if (index >= this.count) throwWriteOutOfBounds()
    },
  }
  
  static [__version] = 0

  static {
    implement(this, ForwardRangeConcept, {
      get cursorType() { return this.constructor.cursorType },
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.count) },
    })

    implement(this, ContainerConcept, {
      get isEmpty() { return this.count == 0 },
    })

    implement(this, FrontEditableContainerConcept, {
      get front() { return this.at(0) },
    }, {
      unshift(value) { },
      shift() { },
    })

    implement(this, BackEditableContainerConcept, {
      get back() { return this.at(this.count - 1) },
    }, {
      pop() { },
      push(value) { },
    })

    implement(this, EditableContainerConcept, {
      insert(cursor, value) {
        const begin = cursor.clone()
        const end = this.end()
        this.ensureCapacity(this.count + 1)
        this._count++
        const cursorPlusOne = cursor.clone().step()
        this.copy(cursorPlusOne, begin, end)
        cursor.value = value
      },
      erase(cursor) {
        const value = cursor.value
        const begin = cursor.clone().step()
        const end = this.end()
        this.copy(cursor, begin, end)
        this._count--
        return cursor.clone()
      },
    })

    implement(this, SizedContainerConcept, {
      // none
    }, {
      get count() { },
    })

    implement(this, IndexableContainerConcept, { 
      // none
    }, {
      at(index) { },
      setAt(index, value) { },
    })
  }
}

