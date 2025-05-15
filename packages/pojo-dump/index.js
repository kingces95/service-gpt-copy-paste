import util from 'util'
import { createWriteStream } from 'fs'

export function dumpPojo(pojo, { 
  format = 'util',
  colors = process.stdout.isTTY,
  path = null
} = { }) {

  const writable = path ? 
    createWriteStream(path) : process.stdout

  switch (format) {
    case 'json':
      writable.write(JSON.stringify(pojo, null, 2))
      break
    default:
      writable.write(util.inspect(pojo, { colors, depth: null }))
  }

  writable.write('\n')
}