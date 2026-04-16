import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Extensions } from '@kingjs/extensions'
import { es6DefineType } from '@kingjs/es6-define-type'
import { extend } from '@kingjs/partial-extend'

export function define(type, attachments = { }) {
  assert(isPojo(attachments))
  extend(type, es6DefineType(null, Extensions, attachments))
}
