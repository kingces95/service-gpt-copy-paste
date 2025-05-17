import util from 'util'

export function formatPojo(pojo, { 
  colors = false,
  format = 'util',
} = { }) {

  switch (format) {
    case 'json':
      return JSON.stringify(pojo, null, 2)
    default:
      return util.inspect(pojo, { colors, depth: null })
  }
}