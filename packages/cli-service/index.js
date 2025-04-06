import { Cli } from '@kingjs/cli'

export class CliService extends Cli {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliService.initializing(new.target, { })) 
      return super()

    super(options)
  }
}

export class CliServiceThread extends CliService {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliServiceThread.initializing(new.target))
      return super()
    super(options)
  }

  async start(signal) { }
}

export class CliServiceProvider extends Cli {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliServiceProvider.initializing(new.target, { })) 
      return super()

    super(options)
  }

  async activate() { return this }
}

// Cli.__dumpMetadata()
