import { CliProcess } from '@kingjs/cli-process'

export const DEFAULT_IFS = ' \t\n'

export class CliParser {

  static get ifs() {
    const env = CliProcess.env
    const ifs = env?.IFS
    return ifs != null ? ifs : DEFAULT_IFS
  }

  static *#split(line, count) {
    if (count == 0) return

    const ifs = CliParser.ifs
    const ws = ' \t\n'

    const wsIFS = [...ifs].filter(c => ws.includes(c)).join('')
    const nonWsIFS = [...ifs].filter(c => !ws.includes(c)).join('')

    const leadingWsRe = new RegExp(`^[${wsIFS}]+`)
    const trailingWsRe = new RegExp(`[${wsIFS}]+$`)
    const trimWsIFS = (s) => s.replace(leadingWsRe, '').replace(trailingWsRe, '')

    const useNonWs = nonWsIFS.length > 0
    const nonWsRegex = new RegExp(`([^${nonWsIFS}]+)([${nonWsIFS}])?`, 'g')
    const wsRegex = new RegExp(`[^${wsIFS}]+`, 'g')
    const splitRegex = useNonWs ? nonWsRegex : wsRegex

    let i = 0
    let match
    while (i < count - 1) {
      match = splitRegex.exec(line)
      if (match == null) return
      yield useNonWs ? trimWsIFS(match[1]) : match[0]
      i++
    }

    const remaining = line.slice(splitRegex.lastIndex)
    yield trimWsIFS(remaining)      
  }

  static #parseBoolean(value) {
    if (value === undefined) return false
    if (value === '') return false
    if (value === '0') return false
    if (value === 'false') return false
    if (value === 'False') return false
    return true
  }

  static #parseNumber(value) {
    if (value === undefined) return NaN
    if (value == '') return NaN
    return Number(value)
  }

  static toArray(line, count = 0) {
    const result = []
    const iterator = this.#split(line, count)
    for (const value of iterator) result.push(value)
    while (result.length < count) result.push('')
    return result
  }
  
  static toRecord(line, metadata = {}) {
    let record = { }
  
    if (Array.isArray(metadata)) {
      const iterator = this.#split(line, metadata.length)
      metadata.forEach((field) => {
        record[field] = iterator.next().value
      })
    } else if (typeof metadata === 'object') {
      const names = Object.keys(metadata)
      const iterator = this.#split(line, names.length)
  
      names.forEach((name) => {
        let value = iterator.next().value
  
        // alias # for number and ! for boolean
        var type = metadata[name]
        if (type == '#') type = 'number'
        if (type == '!') type = 'boolean'
  
        // deserialize
        if (type === 'number') {
          record[name] = this.#parseNumber(value)
        } else if (type === 'boolean') {
          record[name] = this.#parseBoolean(value)
        } else {
          record[name] = value ?? ''
        }
      })
    }
  
    return record
  }
}