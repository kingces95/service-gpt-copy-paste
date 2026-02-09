import { SequenceContainer } from '../sequence-container.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { RewindCursor } from './rewind-cursor.js'
import { implement } from '@kingjs/implement'
import {
  throwEmpty,
} from '@kingjs/cursor'
import { 
  RewindContainerConcept, 
  RewindContainerConcept$, 
} from '../../container-concepts.js'

export class RewindContainer extends SequenceContainer {
  static [Preconditions] = {
    pop() {
      if (this.isEmpty) throwEmpty()
    },
    get back() {
      if (this.isEmpty) throwEmpty()
    }  
  }
  
  static get cursorType() { return RewindCursor }

  static {
    implement(this, RewindContainerConcept$, {
      // stepBack$(token) { }
    })
    implement(this, RewindContainerConcept, {
      // get back() { }
      // push(value) { }
      // pop() { }
      // get count() { }
    })
  }
}
