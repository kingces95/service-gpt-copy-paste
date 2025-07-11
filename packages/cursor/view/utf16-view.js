import { ComposedView } from './composed-view.js'
import { UnitView } from './unit-view.js'
import { Utf16ViewCursor } from './utf16-view-cursor.js'

export class Utf16View extends ComposedView {
  static get Cursor() { return Utf16ViewCursor }

  constructor(view) {
    super(new UnitView(view, 2))
  }
}
