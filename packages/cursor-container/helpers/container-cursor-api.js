import { Concept } from '@kingjs/concept'

// api between a container and its cursors

export class SequenceContainerConcept$ extends Concept {

  // basic cursor
  equals$(cursor, other) { }

  // step cursor
  step$(cursor) { }

  // input cursor
  value$(cursor) { }

  // output cursor
  setValue$(cursor, value) { }
}

export class RewindContainerConcept$ extends SequenceContainerConcept$ {

  // rewind cursor
  stepBack$(cursor) { } 
}

export class IndexableContainerConcept$ extends RewindContainerConcept$ {

  // indexable cursor
  at$(cursor, offset) { }
  setAt$(cursor, offset, value) { }
  subtract$(cursor, otherCursor) { }
  move$(cursor, offset) { }
  compareTo$(cursor, otherCursor) { }
}

export class ContiguousContainerConcept$ extends IndexableContainerConcept$ {

  // contiguous cursor
  readAt$(cursor, offset, length, signed, littleEndian) { }
}