export class Projector {
  _container

  constructor(container) {
    this._container = container
  }

  get container() { return this._container }

  isSynchronized() { return true }

  synchronize(sourceCursor) {
    return sourceCursor.clone()
  }

  projectCursor(sourceCursor) {
    return new this.container.cursorType(
      this.container,
      sourceCursor.clone()
    )
  }

  projectValue(sourceCursor, stride) {
    return this.container.decodeToken$(sourceCursor.clone(), stride)
  }
}
