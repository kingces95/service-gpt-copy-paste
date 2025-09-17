import { SequenceCursor } from '../sequence-cursor.js'
import { implement } from '@kingjs/concept'
import { 
  BidirectionalCursorConcept,
} from '@kingjs/cursor'

export class RewindCursor extends SequenceCursor {
  static { implement(this, BidirectionalCursorConcept) }
  
  constructor(reversible, token) {
    super(reversible, token)
  }

  // rewind cursor
  stepBack() {
    this.token$ = this.container$.stepBack$(this.token$)
    return this
  }
}