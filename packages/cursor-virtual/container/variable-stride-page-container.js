import { PageContainer } from './page-container.js'
import { VariableStridePageCursor } from '../cursor/variable-stride-page-cursor.js'

export class VariableStridePageContainer extends PageContainer {
  static cursorType = VariableStridePageCursor

  _isContinuation

  constructor(range, {
    isContinuation,
    virtualizeOffset,
  }) {
    super(range, { virtualizeOffset })
    this._isContinuation = isContinuation
  }
}
