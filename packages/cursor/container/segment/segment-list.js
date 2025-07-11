import { SegmentContainer } from "./segment-container"
import { List } from '../sequence/rewind/indexable/list.js'

export class SegmentList extends SegmentContainer {
  constructor() { super(new List()) }
}