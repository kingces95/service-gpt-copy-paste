import { Container } from '../container.js'
import { SequenceCursor } from './sequence-cursor.js'
import { implement } from '@kingjs/implement'
import {
  throwEmpty,
} from '@kingjs/cursor'
import { Preconditions } from '@kingjs/debug-proxy'
import { 
  SequenceContainerConcept,
  SequenceContainerConcept$,
} from '../container-concepts.js'

export class SequenceContainer extends Container {
  static [Preconditions] = class extends Container[Preconditions] {
    shift() {
      if (this.isEmpty) throwEmpty()
    }
    get front() {
      if (this.isEmpty) throwEmpty()
    }
  }

  static get cursorType() { return SequenceCursor }

  constructor() {
    super()
  }

  static {
    implement(this, SequenceContainerConcept$, {
      // basic cursor
      // equals$(token, other) { }

      // step cursor
      // step$(token) { }

      // input cursor
      // value$(token) { }

      // output cursor
      // setValue$(token, value) { }
    })

    implement(this, SequenceContainerConcept, {
      // get front() { }
      // unshift(value) { }
      // shift() { }
    })
  }
  
  __isActive$(token) { return true } 
}
