import { ComposedView } from './composed-view.js'
import { JoinViewCursor } from './join-view-cursor.js'

export class JoinView extends ComposedView {
  static get Cursor() { return JoinViewCursor }

  constructor(view) {
    super(view)
  }

  begin$() {
    const [ outter, inner ] = this.data() || []
    const beginOutter = this.view$.begin(outter)
    const beginInner = beginOutter.value?.begin(inner)
    this.cursor$(beginOutter, beginInner)
  }
  end$() {
    const [ outter, inner ] = this.data() || []
    const endOutter = this.view$.end(outter)
    const endInner = endOutter.value?.end(inner)
    this.cursor$(endOutter, endInner)
  }

  data$(cursor) {
    // return tuple of [outter, inner]
    const outter = cursor.outterCursor$
    const inner = cursor.innerCursor$
    return [outter, inner]
  }
}
