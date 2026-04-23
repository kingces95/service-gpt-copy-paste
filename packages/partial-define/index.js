import { 
  Attachments, 
  AbstractAttachments 
} from '@kingjs/partial-attachments'
import { extend } from '@kingjs/partial-extend'
import { From } from '@kingjs/partial-symbols'

export function define(type, definitions = { }) {
  const partialType = Attachments[From](definitions)
  extend(type, partialType)
}

export function defineAbstract(type, definitions = { }) {
  const partialType = AbstractAttachments[From](definitions)
  extend(type, partialType)
}