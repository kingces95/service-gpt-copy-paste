import { CliCommand } from '@kingjs/cli-command'

export class CliSimulator extends CliCommand {
  static description = 'Simulate error conditions'
  static parameters = {
    where: 'Where to throw error',
  }
  static choices = {
    where: [ 'ctor', 'loop' ]
  }
  static { this.initialize(import.meta) }

  constructor({ where = 'ctor', ...rest } = { }) {
    if (CliSimulator.initializing(new.target, { where }))
      return super()
    super(rest)

    if (where == 'loop')
      setTimeout(() => { throw 'Error thrown from event loop' }, 0)
    else
      throw 'Error thrown from constructor'
  }
}

