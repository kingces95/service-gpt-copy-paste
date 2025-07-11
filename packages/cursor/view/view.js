import { CursorFactory } from "../cursor/cursor-factory.js"

export class View extends CursorFactory {
  constructor() { }

  get isEmpty() { return this.begin().isEnd }
}
