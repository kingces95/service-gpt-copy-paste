import { NodeName } from '@kingjs/node-name' 
import { CliCommand } from '@kingjs/cli-command'
import { CliOutputService } from '@kingjs/cli-output-service'

// Just for fun...
export class CliNodeName extends CliCommand {
  static description = 'Reflect on NodeName'
  static parameters = {
    name: 'Name to resolve',
  }
  static services = { 
    format: CliOutputService
  }
  static { this.initialize() }

  constructor(name, options = {}) {
    if (CliNodeName.initializing(new.target, name))
      return super()

    super(options)

    NodeName.from(name).toPojo()
      .then(o => this.log(o))
  }

  log(pojo) {
    this.format.write(pojo)
  }
}

