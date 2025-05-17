import { createWriteStream } from 'fs'
import { formatPojo } from '@kingjs/pojo-format'

export function dumpPojo(pojo, { 
  format = 'util',
  path = null
} = { }) {
  const writable = path ? createWriteStream(path) : process.stdout
  const colors = writable.isTTY
  writable.write(formatPojo(pojo, { format, colors }))
  writable.write('\n')
}