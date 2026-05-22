import { PartialProxy } from '@kingjs/partial-proxy'

export class AdapterView extends PartialProxy {
  _range

  constructor(range) {
    super()
    this._range = range
  }

  get range() { return this._range }
}
