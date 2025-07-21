import { SegmentContainer } from "./segment-container"
import { Deque } from '../sequence/rewind/indexable/deque.js'

export class SegmentDeque extends SegmentContainer {
  constructor() { super(new Deque()) }
}