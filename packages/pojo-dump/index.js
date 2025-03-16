import util from 'util'

export function dumpPojo(pojo, { 
  format = 'util',
  colors = process.stdout.isTTY,
} = { }) {

  switch (format) {
    case 'json':
      console.log(JSON.stringify(pojo, null, 2))
      break
    default:
      console.log(util.inspect(pojo, { colors, depth: null }))
  }
}