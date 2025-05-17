export const DEFAULT_IFS = ' \t\n'

export class CliParser {
  #ifs

  constructor(ifs = DEFAULT_IFS) {
    this.#ifs = ifs
  }

  *#split(line, count) {
    const ifs = this.#ifs
    const regex = new RegExp(`([^${ifs}]+)[${ifs}]*`, 'g')
    let lastIndex = 0
  
    for (let i = 0; i < count - 1; i++) {
      const match = regex.exec(line)
      if (match) {
        yield match[1]
        lastIndex = regex.lastIndex
      } else {
        return
      }
    }
  
    // Yield the rest of the line as the last field
    yield line.slice(lastIndex)
  }

  async toArray(line) {
    const iterator = this.#split(line, Infinity)
    return Array.from(iterator)
  }
  
  async toRecord(line, fields) {
    let record = { }
  
    if (Array.isArray(fields)) {
      const iterator = this.#split(line, fields.length)
      fields.forEach((field, index) => {
        record[field] = iterator.next().value
      })
    } else if (typeof fields === 'object') {
      const fieldNames = Object.keys(fields)
      const iterator = this.#split(line, fieldNames.length)
  
      fieldNames.forEach((field, index) => {
        const value = iterator.next().value
        if (value === undefined || value === null) 
          return
  
        var type = fields[field]
        if (type == '#') type = 'number'
        if (type == '!') type = 'boolean'
  
        if (type === 'number') {
          record[field] = Number(value)
  
        } else if (type === 'boolean') {
          record[field] = !(
            value === '' 
            || value === 'false' 
            || value === 'False' 
            || value === '0')
        } else {
          record[field] = value
        }
      })
    }
  
    return record
  }
}
