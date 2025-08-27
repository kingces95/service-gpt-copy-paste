import { CursorFactory } from '../cursor/cursor-factory.js'
import { GlobalPrecondition } from '@kingjs/proxy'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwDisposed,
} from '@kingjs/cursor'

export class Container extends CursorFactory {
  static [Preconditions] = class extends CursorFactory[Preconditions] { 
    [GlobalPrecondition]() {
      const container = this
      if (container.isDisposed$) throwDisposed()
    }
  }

  #version
  #disposed

  constructor() { 
    super()
    this.#version = 0
    this.#disposed = false
  }

  get isDisposed$() { return this.#disposed }

  // A debug helper which detects when a cursor is invalidated. Typically,
  // this happens during an unshift of shift operation as that operation
  // invalidates all index cursors. Cursors that reference a node cannot be
  // invalidated so those containers will not bump the version.
  get __version$() { return this.#version }
  __bumpVersion$() { this.#version++ }

  // container methods
  // dispose$() { }
  dispose() {
    this.dispose$()
    this.#disposed = true
    return this
  }
}
