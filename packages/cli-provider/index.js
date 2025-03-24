import { Cli } from '@kingjs/cli'

export class CliProvider extends Cli {
  static { this.initialize() }

  constructor({ _command, ...rest } = { }) {
    if (CliProvider.initializing(new.target, { })) 
      return super()

    super(rest)
  }

  activate($class) { return this }
}

