import { DebugCursor } from '../cursor/debug-cursor.js'

export class ContainerCursor extends DebugCursor {
  #container

  constructor(container) {
    super(container.__version$)
    this.#container = container
  }

  get __isActive$() { 
    const version = this.__version$
    return this.container$.__isActive$(version) 
  }
  get container$() { return this.#container }

  recycle$(container) {
    if (container != this.container$) throw new Error(
      "Cursor cannot be recycled to a different container.")

    super.recycle$()
  }

  equatableTo$(other) { 
    return this.container$.equatableTo$(other) 
  }

  // forward container cursor proxy
  clone$() { return this.clone$$() }
}
