import { Range } from "@kingjs/cursor"

export class AdapterView extends Range {
  _range

  constructor(range) {
    super()
    this._range = range
  }

  get range() { return this._range }
}
