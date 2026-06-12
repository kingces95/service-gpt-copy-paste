import { PageContainer } from './page-container.js'
import { FixedStridePageCursor } from '../cursor/fixed-stride-page-cursor.js'

export class FixedStridePageContainer extends PageContainer {
  static cursorType = FixedStridePageCursor

  _modulus
  _strideLength

  constructor(range, {
    modulus,
    strideLength,
    virtualizeOffset,
  }) {
    super(range, { virtualizeOffset })
    this._modulus = modulus
    this._strideLength = strideLength
  }
}
