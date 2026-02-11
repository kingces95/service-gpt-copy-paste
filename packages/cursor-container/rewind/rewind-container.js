import { SequenceContainer } from '../sequence/sequence-container.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { RewindCursor } from '../cursor/rewind-cursor.js'
import { implement } from '@kingjs/implement'
import {
  throwEmpty,
} from '@kingjs/cursor'
import { 
  EpilogContainerConcept,
  RewindContainerConcept, 
} from '../container-concepts.js'
import {
  RewindContainerConcept$, 
} from '../cursor/container-cursor-api.js'

export class RewindContainer extends SequenceContainer {
  static [Preconditions] = {
    pop() { if (this.isEmpty) throwEmpty() },
    get back() { if (this.isEmpty) throwEmpty() }  
  }
  
  static get cursorType() { return RewindCursor }

  static {
    implement(this, RewindContainerConcept$, {
      // stepBack$(cursor) { }
    })
    implement(this, RewindContainerConcept, {
      // get back() { }
      // push(value) { }
      // pop() { }
      // get count() { }
    })
    implement(this, EpilogContainerConcept, {
      // insert(cursor, value) { }
      // remove(cursor) { }
    })
  }
}
