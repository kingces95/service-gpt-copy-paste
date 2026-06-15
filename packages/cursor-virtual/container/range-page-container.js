import { PageContainer } from './page-container.js'
import { RangePageCursor } from '../cursor/range-page-cursor.js'

export class RangePageContainer extends PageContainer {
  static cursorType = RangePageCursor

  _container
  _outerCursor
  _innerCursorEnd
  _virtualEnd

  constructor(range, {
    container,
    outerCursor,
    innerCursorEnd,
    virtualEnd,
  }) {
    super(range)
    this._container = container
    this._outerCursor = outerCursor
    this._innerCursorEnd = innerCursorEnd
    this._virtualEnd = virtualEnd
  }
}
