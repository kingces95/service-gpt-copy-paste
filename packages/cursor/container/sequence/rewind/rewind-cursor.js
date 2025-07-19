import { SequenceCursor } from '../sequence-cursor.js'
import { implement } from '@kingjs/concept'
import { 
  BidirectionalCursorConcept,
} from '../../../cursor/cursor-concepts.js'

export class RewindCursor extends SequenceCursor {
  static { implement(this, BidirectionalCursorConcept) }
  
  constructor(reversible, token) {
    super(reversible, token)
  }

  // rewind cursor
  get reversible$() { return this.sequence$ }

  // bidirectional rewind cursor concept implementation
  stepBack$() {
    const result = this.reversible$.stepBack$(this.token$)
    if (result === false) return false
    this.token$ = result
    return true
  }

  // bidirectional rewind cursor concept
  stepBack() { return this.stepBack$() }
}