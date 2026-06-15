import { PageContainer } from './page-container.js'
import { VariableStridePageCursor } from '../cursor/variable-stride-page-cursor.js'

export class VariableStridePageContainer extends PageContainer {
  static cursorType = VariableStridePageCursor

  _isContinuation
  _sourcePage

  constructor(sourcePage, {
    isContinuation,
  }) {
    super(sourcePage)
    this._isContinuation = isContinuation
    this._sourcePage = sourcePage
  }
}
