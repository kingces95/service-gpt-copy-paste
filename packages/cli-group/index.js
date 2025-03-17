import { Cli } from '@kingjs/cli'

export class CliGroup extends Cli {
 
  constructor({ _command, ...rest } = { }) {
    if (CliGroup.initializing(new.target, { })) 
      return super()

    super(rest)
  }
}

