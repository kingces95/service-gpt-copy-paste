import { Extensions } from '@kingjs/extensions'
import { extend } from '@kingjs/partial-extend'
import { Define } from '@kingjs/partial-symbols'

export function define(type, attachments = { }) {
  const partialType = Extensions[Define](attachments)
  extend(type, partialType)
}
