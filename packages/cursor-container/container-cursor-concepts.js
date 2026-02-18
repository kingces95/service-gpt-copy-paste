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
  static [Implements] = ForwardCursorConcept

  static [Preconditions] = {
    step() { 
      if (this.container.isEnd(this)) throwMoveOutOfBounds() },
    get value() { 
      if (this.container.isEnd(this)) throwReadOutOfBounds() },
    set value(value) { 
      if (this.container.isEnd(this)) throwWriteOutOfBounds() }
  }

  get container() { }
}

export class BidirectionalContainerCursorConcept 
  extends ContainerCursorConcept {
  static [Implements] = BidirectionalCursorConcept

  static [Preconditions] = {
    stepBack() { if (this.container.isBeforeBegin(this)) 
      throwMoveOutOfBounds() }
  }
}

export class LinkedCursorConcept 
  extends ContainerCursorConcept {

  static [Preconditions] = {
    step() {
      if (!this.isReachable) throwMoveOutOfBounds() },
    get value() {
      if (!this.isReachable) throwReadOutOfBounds() },
    set value(value) {
      if (!this.isReachable) throwWriteOutOfBounds() }
  }

  get isReachable() { }
}

export class LinkedBidirectionalContainerCursorConcept 
  extends BidirectionalContainerCursorConcept {

  static [Preconditions] = {
    stepBack() {
      if (!this.isReachable) throwMoveOutOfBounds() },
  }
}
