import { SequenceCursor } from './sequence-cursor.js'
import { implement } from '@kingjs/implement'
import { 
  BidirectionalCursorConcept,
} from '@kingjs/cursor'

export class RewindCursor extends SequenceCursor {
  
  constructor(reversible, token) {
    super(reversible, token)
  }

  static { 
    implement(this, BidirectionalCursorConcept, {
      stepBack() {
        const { container$: container } = this
        this.token$ = container.stepBack$(this)
        return this
      }    
    }) 
  }
}