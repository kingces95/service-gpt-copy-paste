import { CliCommand } from '@kingjs/cli-command'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { CliRuntime } from '@kingjs/cli-runtime'
import { CliPathStyle } from '@kingjs/cli-path-style'

export class CliLoader {
  static async activate(classOrPojo, options = { }) {
    const { metadata } = options
    const isClass = typeof classOrPojo == 'function'
    const class$ = isClass ? classOrPojo : CliCommand.extend(classOrPojo)
    const cachedMetadata = CliClassMetadata.fromMetadataPojo(
      metadata ?? await (
        await CliClassMetadata.fromClass(class$)
      ).toPojo()
    )
    const info = CliCommandInfo.fromMetadata(cachedMetadata)
    return new CliLoader(class$, info)
  }

  static async *#runtimeParameters(info) {
    // walk command hierarchy yielding parameters; allow derived classes to 
    // override base class parameters; skip local inherited parameters
    const slots = new Map()
    for await (const parameter of info.parameters()) {
      yield parameter
      slots.set(parameter.name, parameter)
    }

    for (const current of info.parent?.hierarchy() ?? []) {
      for await (const parameter of current.parameters() ) {
        if (slots.has(parameter.name)) continue
        if (parameter.isLocal) continue
        yield parameter
        slots.set(parameter.name, parameter)
      }
    }
  }
  
  #class // CliCommand
  #info // CliCommandInfo

  constructor(class$, info) {
    this.#class = class$
    this.#info = info
  }

  get class() { return this.#class }
  get info() { return this.#info }

  async load(userPath) {
    // procedural => declarative initialization
    const path = CliPathStyle.fromCamel(userPath)
    const runtimePath = path.toCamel()
    const info = this.info.getCommand(...runtimePath)
    const parameters = await Array.fromAsync(CliLoader.#runtimeParameters(info))

    const class$ = await this.class.getCommand(...runtimePath)
    return new CliRuntime(this, path, class$, info, parameters)
  }
}
