export class View {
  #__version = 0

  constructor() { }

  cursor$(recyclable, ...args) {
    const Cursor = this.constructor.Cursor
    return recyclable 
      ? recyclable.recycle$(this, ...args) 
      : new Cursor(this, ...args)
  }

  get __version$() { return this.#__version }
  __bumpVersion$() { this.#__version++ }

  get isEmpty() { return this.begin().isEnd }

  begin(recyclable, ...args) {
    return this.cursor$(recyclable, ...args)
  }
  end(recyclable, ...args) {
    return this.cursor$(recyclable, ...args)
  }

  cbegin(recyclable, ...args) {
    const begin = this.begin(recyclable, ...args)
    begin.isReadOnly = true
    return begin
  }
  cend(recyclable, ...args) {
    const end = this.end(recyclable, ...args)
    end.isReadOnly = true
    return end
  }
}
