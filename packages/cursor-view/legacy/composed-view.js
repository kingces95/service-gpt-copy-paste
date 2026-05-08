import { View } from './view.js'

export class ComposedView extends View {
  #view

  constructor(view) {
    super()
    this.#view = view
  }

  get view$() { return this.#view }

  begin$() {
    const [ cursor ] = this.data() || []
    this.cursor$(cursor)
  }
  end$() {
    const [ cursor ] = this.data() || []
    this.cursor$(cursor)
  }

  data$(cursor) {
    
    // verify cursor is owned by this view
    if (cursor.view$ !== this)
      throw new Error("Cursor is not owned by this view.")

    // unwrap the compsoed cursor
    return [ cursor.cursor$ ]
  }
}
