import { Preconditions } from '@kingjs/partial-proxy'
import { Concept, Implements } from '@kingjs/concept'
import {
  ForwardCursorConcept,
  BidirectionalCursorConcept,

  throwMoveOutOfBounds,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from '@kingjs/cursor'

export class ContainerCursorConcept extends Concept {
  static [Preconditions] = {
    step() { 
      if (this.equals(this.container.end({ const: true }))) 
        throwMoveOutOfBounds() 
    },
    get value() { 
      if (this.equals(this.container.end({ const: true })))
        throwReadOutOfBounds()
    },
    set value(value) { 
      if (this.equals(this.container.end({ const: true })))
        throwWriteOutOfBounds()
    },
  }

  static [Implements] = ForwardCursorConcept
  
  get container() { }
}

export class BidirectionalContainerCursorConcept 
  extends ContainerCursorConcept {
  static [Implements] = BidirectionalCursorConcept

  static [Preconditions] = {
    stepBack() { 
      if (this.equals(this.container.beforeBegin({ const: true })))
        throwMoveOutOfBounds()
    }
  }
}
