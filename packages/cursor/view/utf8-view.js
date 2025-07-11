import { ComposedView } from './composed-view.js'
import { Utf8ViewCursor } from './utf8-view-cursor.js'

export class Utf8View extends ComposedView {
  static get Cursor() { return Utf8ViewCursor }

  constructor(view) {
    super(view)
  }
}
