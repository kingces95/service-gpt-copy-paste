import { CliGroup } from '@kingjs/cli-group'
import YAML from 'yaml'
import util from 'util'

export const format = Symbol('CliGroupOutput.format')
export const write = Symbol('CliGroupOutput.write')

export class CliGroupOutput extends CliGroup {
  static description = 'Output format'
  static parameters = {
    output: 'Output format',
    query: 'JMESPath query string',
    color: 'Colorize output; Always false if not a TTY',
  }
  static choices = {
    output: [ 
      'util', 'json', 
      'table', 'yaml', 
      'xml', 'csv', 
      'tsv', 'none' 
    ]
  }
  static methods = {
    format: Symbol('CliGroupOutput.format'),
    write: Symbol('CliGroupOutput.write'),
  }
  static defaults = CliGroupOutput.loadDefaults()
  // static { CliGroupOutput.initialize() }

  constructor({ 
    output = 'util', 
    query = null, 
    color = true, 
  } = { }) {
    if (CliGroupOutput.loadingDefaults(new.target, { output, query, color }))
      return super()

    this.color = color && process.stdout.isTTY
    this.output = output
    this.query = query
  }

  format(pojo = {}) {
    switch (this.output) {
      case 'json':
        return JSON.stringify(pojo, null, 2)
      case 'yaml':
        return YAML.stringify(pojo)
      default:
        return util.inspect(pojo, { colors: this.color, depth: null })
    }
  }

  write(pojo) {
    const formatted = this.format(pojo)
    console.log(formatted)
  }
}
