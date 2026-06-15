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

  projectCursor(page, pageCursor) {
    const sourceCursor = page.virtualize(pageCursor)
    if (!sourceCursor)
      return null

    return new this.container.cursorType(
      this.container,
      sourceCursor
    )
  }

  projectValue(sourceCursor, stride) {
    return this.container.decodeToken$(sourceCursor.clone(), stride)
  }
}
