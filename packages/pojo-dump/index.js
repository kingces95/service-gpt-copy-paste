import util from 'util'

export function dumpPojo(pojo) {
  console.error(util.inspect(pojo, { colors: true, depth: null }))
}