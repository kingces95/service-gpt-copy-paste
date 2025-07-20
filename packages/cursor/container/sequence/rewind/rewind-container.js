import { SequenceContainer } from '../sequence-container.js'
import { Preconditions } from '@kingjs/debug-proxy'
import { RewindCursor } from './rewind-cursor.js'
import {
  throwNotImplemented,
  throwEmpty,
} from '../../../throw.js'

export class RewindContainer extends SequenceContainer {
  static [Preconditions] = class extends SequenceContainer[Preconditions] {
    pop() {
      if (this.isEmpty) throwEmpty()
    }
    get back() {
      if (this.isEmpty) throwEmpty()
    }
  }
  
  static get cursorType$() { return RewindCursor }

  constructor() {
    super()
  }

  // rewind cursor
  stepBack$(token) { throwNotImplemented() }

  // container
  get isEmpty() { return this.count == 0 }

  // rewind
  get count() { throwNotImplemented() }
  get back() { throwNotImplemented() }

  push(value) { throwNotImplemented() }
  pop() { throwNotImplemented() }
}
