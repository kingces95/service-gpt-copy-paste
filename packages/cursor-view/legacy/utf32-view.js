import { ComposedView } from './composed-view.js'
import { UnitView } from './unit-view.js'
import { Utf32ViewCursor } from './utf32-view-cursor.js'

export class Utf32View extends ComposedView {
  static get Cursor() { return Utf32ViewCursor }

  constructor(view) {
    super(new UnitView(view, 4))
  }
}
