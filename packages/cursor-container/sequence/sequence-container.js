import { Container } from '../container.js'
import { SequenceCursor } from './sequence-cursor.js'
import { implement } from '@kingjs/implement'
import { 
  SequenceContainerConcept,
  SequenceContainerConcept$,
} from '../container-concepts.js'

export class SequenceContainer extends Container {
  static get cursorType() { return SequenceCursor }

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
}
