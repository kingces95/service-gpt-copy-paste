import { CliServiceProvider } from '@kingjs/cli-service'
import { CliStdOut } from '@kingjs/cli-std-stream'
import { NodeName } from '@kingjs/node-name'
import jmespath from 'jmespath'

const MODULE_NAME = NodeName.from('@kingjs/cli-output-service')

export class CliOutputService extends CliServiceProvider {
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
  static services = {
    stdout: CliStdOut,
  }
  static { this.initialize(import.meta) }

  #color
  #query
  #stdout

  constructor({ output = 'util', query = null, color = true, ...rest } = { }) {
    if (CliOutputService.initializing(new.target, { output, query, color }))
      return super()
    super({ ...rest })

    const { stdout } = this.getServices(CliOutputService)
    this.#stdout = stdout
    this.#color = color
    this.#query = query
  }

  query(pojo) {
    if (!this.#query) return pojo
    return jmespath.search(pojo, this.#query) 
  }

  // TODO: forEach not used; update tsv/table to use this
  async forEach(poja, action) {
    const stdout = await this.#stdout
    poja = this.query(poja)
    poja = Array.isArray(poja) ? poja : [poja]
    for (var i = 0; i < poja.length; i++) {
      const pojo = poja[i]
      action(pojo, i)
    }

    // per unix conventions, ensure there is a newline at the end of the output
    if (!poja.length) {
      await stdout.write('\n')
      return
    }
  }

  async writeObject(pojo, formatFn) {
    const stdout = await this.#stdout
    pojo = this.query(pojo)
    const color = this.#color && stdout.isTTY
    const value = formatFn(pojo, color)
    await stdout.write(value)

    // per unix conventions, ensure there is a newline at the end of the output
    if (!value.endsWith('\n'))
      await stdout.write('\n')
  }

  async write(pojo) { }
}

// CliOutputService.__dumpMetadata()
