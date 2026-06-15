import { PageContainer } from './page-container.js'
import { VirtualPageCursor } from '../cursor/virtual-page-cursor.js'

export class VirtualPageContainer extends PageContainer {
  static cursorType = VirtualPageCursor

  _virtualBegin
  _virtualEnd

  constructor(range, {
    virtualBegin,
    virtualEnd,
  }) {
    super(range)
    this._virtualBegin = virtualBegin
    this._virtualEnd = virtualEnd
  }
}
