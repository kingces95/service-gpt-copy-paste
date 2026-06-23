export class Projector {
  _container

  constructor(container) {
    this._container = container
  }

  get container() { return this._container }

  projectValue(sourceCursor, stride) {
    return this.container.decodeToken$(sourceCursor.clone(), stride)
  }
}
