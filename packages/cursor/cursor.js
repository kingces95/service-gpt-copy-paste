export class Cursor {
  #__version
  #container

  constructor(container) {
    this.#container = container
    this.#__version = container.__version$
  }

  __checkVersion$() {
    const container = this.#container
    const version = container.__version$
    if (version !== this.#__version) throw new Error(
      "Container has been popped since cursor was created.")
  }

  get isEnd() { throw new Error("Not implemented.") }
  get isBegin() { throw new Error("Not implemented.") }
  get value() { throw new Error("Not implemented.") }

  step() { throw new Error("Not implemented.") }

  equals(other) { throw new Error("Not implemented.") }
}

export class ForwardCursor extends Cursor {

  constructor(container) {
    super(container)
  }

  clone() { throw new Error("Not implemented.") }
} 

export class BidirectionalCursor extends ForwardCursor {

  constructor(container) {
    super(container)
  }

  stepBack() { throw new Error("Not implemented.") }
} 
