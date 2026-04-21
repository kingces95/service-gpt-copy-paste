import { Attachments } from '@kingjs/partial-attachments'
import { extend } from '@kingjs/partial-extend'
import { Define } from '@kingjs/partial-symbols'

export function define(type, attachments = { }) {
  const partialType = Attachments[Define](attachments)
  extend(type, partialType)
}
