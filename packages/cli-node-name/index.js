import { NodeName } from '@kingjs/node-name' 
import { CliCommand } from '@kingjs/cli-command'

// Just for fun...
export class CliNodeName extends CliCommand {
  static description = 'Reflect on NodeName'
  static parameters = {
    name: 'Name to resolve',
  }
  static { this.initialize(import.meta) }

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

