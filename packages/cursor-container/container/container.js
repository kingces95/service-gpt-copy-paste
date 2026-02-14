import { implement } from '@kingjs/implement'
import { DisposeConcept } from '@kingjs/concept'
import { PartialProxy } from '@kingjs/partial-proxy'
import { TypePrecondition } from '@kingjs/partial-proxy'
import { throwDisposed } from '@kingjs/cursor'
import { ContainerCursor } from '../cursor/container-cursor.js'
import { ContainerConcept } from '../container-concepts.js'

export class Container extends PartialProxy {
  static [TypePrecondition]() {
    if (this.isDisposed$) throwDisposed()
  }

  static cursorType = ContainerCursor

  _disposed

  constructor() { 
    super()
    this._disposed = false
  }

  dispose$() { }
  get isDisposed$() { return this._disposed }

  static {
    implement(this, {
      beginToken$() { },
      endToken$() { },
    })

    implement(this, ContainerConcept, {
      get cursorType() { return this.constructor.cursorType },
      begin() {
        const { cursorType } = this
        return new this.cursorType(this, this.beginToken$()) 
      },
      end() { return new this.cursorType(this, this.endToken$()) },
    })

    implement(this, DisposeConcept, {
      dispose() {
        this.dispose$()
        this._disposed = true
        return this
      }
    })
  }
}
