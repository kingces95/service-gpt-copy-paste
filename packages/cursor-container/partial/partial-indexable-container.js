import { implement } from '@kingjs/partial-implement'
import { Preconditions } from '@kingjs/partial-proxy'
import { PartialClass } from '@kingjs/partial-class'
import { define } from '@kingjs/partial-define'
import { extend } from '@kingjs/partial-extend'
import {
  OutputRangeConcept,
  ForwardRangeConcept,
  RandomAccessRangeConcept,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from '@kingjs/cursor'
import {
  ContainerPart,
  FrontEditableContainerPart,
  BackEditableContainerPart,
  EditableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
} from '../container-parts.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'

const __version = Symbol('__version')

export class PartialIndexableContainer extends PartialClass {
  static cursorType = IndexableCursor

  static [Preconditions] = {
    shift() { this[__version]++ || 1 },
    unshift(value) { this[__version]++ || 1 },

    at(index) {
      if (index < 0) throwReadOutOfBounds()
      if (index >= this.size) throwReadOutOfBounds()
    },
    setAt(index, value) {
      if (index < 0) throwWriteOutOfBounds()
      if (index >= this.size) throwWriteOutOfBounds()
    },
  }
  
  static [__version] = 0

  static {
    implement(this, OutputRangeConcept),
    implement(this, RandomAccessRangeConcept, {
      get cursorType() { return this.constructor.cursorType },
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })

    extend(this, ContainerPart, {
      get isEmpty() { return this.size == 0 },
      insert(value, { at = this.begin() } = { }) { this.insertAt(value, at) },
      erase({ at = this.begin() } = { }) { this.eraseAt(at) },
    })

    extend(this, FrontEditableContainerPart, {
      get front() { return this.at(0) },
    }, {
      unshift(value) { },
      shift() { },
    })

    extend(this, BackEditableContainerPart, {
      get back() { return this.at(this.size - 1) },
    }, {
      pop() { },
      push(value) { },
    })

    extend(this, SizedContainerPart, {
      // none
    }, {
      get size() { },
    })

    extend(this, IndexableContainerPart, { 
      // none
    }, {
      at(index) { },
      setAt(index, value) { },
    })
  }
}

