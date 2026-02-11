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
      // equals$(cursor, other) { }

      // step cursor
      // step$(cursor) { }

      // input cursor
      // value$(cursor) { }

      // output cursor
      // setValue$(cursor, value) { }
    })

    implement(this, SequenceContainerConcept, {
      // get front() { }
      // unshift(value) { }
      // shift() { }
    })
  }
}
