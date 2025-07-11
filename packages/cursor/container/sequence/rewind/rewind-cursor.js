import { SequenceCursor } from '../sequence-cursor.js'


export class RewindCursor extends SequenceCursor {
  static get abilities() { 
    return SequenceCursor.abilities
      | SequenceCursor.Ability.Bidirectional
  }
  
  constructor(container, token) {
    super(container, token)
  }

  // bidirectional rewind cursor implementation
  stepBack$() {
    const result = this.container$.stepBack$(this.token$)
    if (result === false) return false
    this.token$ = result
    return true
  }
}