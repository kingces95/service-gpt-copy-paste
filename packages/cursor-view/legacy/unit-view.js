import { ComposedView } from './composed-view.js'
import { UnitViewCursor } from './unit-view-cursor.js'

export class UnitView extends ComposedView {
  static get Cursor() { return UnitViewCursor }

  constructor(view) {
    super(view)
  }
}
