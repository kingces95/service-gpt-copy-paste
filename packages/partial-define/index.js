import { 
  Attachments, 
  AbstractAttachments 
} from '@kingjs/partial-attachments'
import { extend } from '@kingjs/partial-extend'
import { Define } from '@kingjs/partial-symbols'

export function define(type, definitions = { }) {
  const partialType = Attachments[Define](definitions)
  extend(type, partialType)
}

export function defineAbstract(type, definitions = { }) {
  const partialType = AbstractAttachments[Define](definitions)
  extend(type, partialType)
}