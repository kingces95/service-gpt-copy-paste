#!/usr/bin/env node
import { CliServiceProvider } from '@kingjs/cli-service'
import { CliReadable } from '@kingjs/cli-readable'
import { CliWritable } from '@kingjs/cli-writable'

export class CliStdStream extends CliServiceProvider {
  static { this.initialize(import.meta) }

  #path
  #isReadable

  constructor(options, { path, isReadable } = { }) {
    if (CliStdStream.initializing(new.target))
      return super()
    super(options)

    this.#path = path
    this.#isReadable = isReadable
  }

  async activate() {
    return await this.#isReadable 
      ? CliReadable.fromPath(this.#path)
      : CliWritable.fromPath(this.#path)
  }
}
