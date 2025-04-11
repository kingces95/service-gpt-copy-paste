import { Cli } from '@kingjs/cli'

export const REQUIRED = undefined

export class CliCommand extends Cli {
  static parameters = {
    help: 'Show help',
    version: 'Show version',
    verbose: 'Provide verbose output',
  }
  static aliases = {
    help: ['h'],
    version: ['v'],
  }
  static { this.initialize(import.meta) }

  constructor({ 
    help = false, 
    version = false, 
    verbose = false, 
    ...rest 
  } = { }) {
    if (CliCommand.initializing(new.target, { help, version, verbose }))
      return super()
    super({ ...rest })
  }

  async run(signal) { return true }

  toString() { this.runtime.toString() }
}

// CliCommand.__dumpMetadata()
