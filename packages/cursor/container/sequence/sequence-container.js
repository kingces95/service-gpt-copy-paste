import { Container } from '../container.js'
import { SequenceCursor } from './sequence-cursor.js'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotImplemented,
  throwEmpty,
} from '../../throw.js'

export class SequenceContainer extends Container {
  static [Preconditions] = class extends Container[Preconditions] {
    shift() {
      if (this.isEmpty) throwEmpty()
    }
    get front() {
      if (this.isEmpty) throwEmpty()
    }
  }

  static get cursorType$() { return SequenceCursor }

  constructor() {
    super()
  }
  
  __isActive$(token) { return true } 

  // basic cursor
  equals$(token, other) { throwNotImplemented() }

  // step cursor
  step$(token) { throwNotImplemented() }

  // input cursor
  value$(token) { throwNotImplemented() }

  // output cursor
  setValue$(token, value) { throwNotImplemented() }

  // sequence container
  get front() { throwNotImplemented() }
  unshift(value) { throwNotImplemented() }
  shift() { throwNotImplemented() }
}
