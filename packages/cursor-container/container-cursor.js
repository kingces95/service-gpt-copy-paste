import { implement } from '@kingjs/implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { ScopeConcept } from '@kingjs/concept'
import { ContainerCursorConcept } from './container-cursor-concepts.js'

export class ContainerCursor extends PartialProxy {
  _container

  constructor(container) {
    super()
    this._container = container
  }

  get container() { return this._container }

  static {
    implement(this, ScopeConcept, {
      equatableTo(other) {
        if (other?.constructor != this.constructor) return false
        return this._container == other._container
      }
    })
    
    implement(this, ContainerCursorConcept)
  }
}
