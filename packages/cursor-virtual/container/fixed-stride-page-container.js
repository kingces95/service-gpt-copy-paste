import { PageContainer } from './page-container.js'
import { FixedStridePageCursor } from '../cursor/fixed-stride-page-cursor.js'

export class FixedStridePageContainer extends PageContainer {
  static cursorType = FixedStridePageCursor

  _modulus
  _sourcePage
  _strideLength

  constructor(sourcePage, {
    modulus,
    strideLength,
  }) {
    super(sourcePage)
    this._modulus = modulus
    this._sourcePage = sourcePage
    this._strideLength = strideLength
  }
}
