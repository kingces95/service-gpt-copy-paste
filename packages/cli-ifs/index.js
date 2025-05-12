import { CliServiceProvider } from '@kingjs/cli-service'

export const DEFAULT_IFS = ' '

export class CliIfs extends CliServiceProvider {
  static parameters = {
    ifs: 'Input field separator',
  }
  static { this.initialize(import.meta) }

  #ifs

  constructor({ ifs = DEFAULT_IFS, ...rest } = { }) {
    if (CliIfs.initializing(new.target, { ifs }))
      return super()
    super(rest)

    this.#ifs = ifs
  }

  get ifs() { return this.#ifs }

  activate() { return this.ifs }
}
