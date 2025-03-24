import { CliProvider } from '@kingjs/cli-provider'
import { CliOut } from '@kingjs/cli-command'
import { NodeName } from '@kingjs/node-name'
import jmespath from 'jmespath'

const MODULE_NAME = NodeName.from('@kingjs/cli-output-service')

export class CliOutputService extends CliProvider {
  static description = 'Output format'
  static parameters = {
    output: 'Output format',
    query: 'JMESPath query string',
    color: 'Colorize output; Always false if not a TTY',
  }
  static group = 'output format'
  static choices = {
    output: {
      none:  MODULE_NAME,
      util:  MODULE_NAME.addExport('util'),
      json:  MODULE_NAME.addExport('json'),
      yaml:  MODULE_NAME.addExport('yaml'),
      tsv:   MODULE_NAME.addExport('tsv'),
      table: MODULE_NAME.addExport('table'),
    },
  }
  static services = [ CliOut ]
  static { this.initialize() }

  #color
  #query
  #stdout
  
  constructor({ output = 'util', query = null, color = true, ...rest } = { }) {
    if (CliOutputService.initializing(new.target, { output, query, color }))
      return super()

    super({ ...rest })
    this.#color = color
    this.#query = query
    this.#stdout = this.getService(CliOut)
  }

  get stdout() { return this.#stdout }
  get color() { return this.#color && this.stdout.isTTY }

  query(pojo) {
    if (!this.#query) return pojo
    return jmespath.search(pojo, this.#query) 
  }

  // TODO: forEach not used; update tsv/table to use this
  async forEach(poja, action) {
    poja = this.query(poja)
    poja = Array.isArray(poja) ? poja : [poja]
    for (var i = 0; i < poja.length; i++) {
      const pojo = poja[i]
      action(pojo, i)
    }

    // per unix conventions, ensure there is a newline at the end of the output
    if (!poja.length) {
      await this.stdout.write('\n')
      return
    }
  }

  async writeObject(pojo, formatFn) {
    pojo = this.query(pojo)
    const value = formatFn(pojo)
    await this.stdout.write(value)

    // per unix conventions, ensure there is a newline at the end of the output
    if (!value.endsWith('\n'))
      await this.stdout.write('\n')
  }

  async write(pojo) { }
}

// CliOutputService.__dumpMetadata()
