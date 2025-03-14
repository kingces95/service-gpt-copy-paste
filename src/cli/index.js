import { cliYargs } from '@kingjs/cli-yargs'
import { NodeName } from '@kingjs/node-name'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { CliYargsCommand } from '@kingjs/cli-yargs'
import { dumpPojo } from '@kingjs/pojo-dump'
import { hideBin } from 'yargs/helpers'

const REQUIRED = undefined

const raw = {
  description: 'Dump Cli.getOwnMetadata()',
  parameters: { hierarchy: 'Walk and dump base classes, too.' },
  defaults: { hierarchy: false },
  handler: async function(module, path, { hierarchy } = { }) {
    const name = NodeName.from(module)
    const scope = await name.importObject()
    const class$ = await scope.getCommand(path)
    const pojo = !hierarchy ? class$.getOwnMetadata() 
      : [...class$.hierarchy()].map(o => o.getOwnMetadata())
    dumpPojo(pojo)
  }
}

const md = {
  description: `Dump ${CliClassMetadata.name}`,
  handler: async function(module, path) {
    const name = NodeName.from(module)
    const scope = await name.importObject()
    const class$ = await scope.getCommand(path)
    const metadata = await CliClassMetadata.fromClass(class$)
    await metadata.__dump()
  }
}

const info = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function(module, path) {
    const name = NodeName.from(module)
    const scope = await name.importObject()
    const class$ = await scope.getCommand(path)
    const metadata = await CliClassMetadata.fromClass(class$)
    const info = CliCommandInfo.from(metadata)
    await info.__dump()
  }
}

const yargs = {
  description: `Dump ${CliYargsCommand.name}`,
  handler: async function(module, path) {
    const name = NodeName.from(module)
    const scope = await name.importObject()
    const class$ = await scope.getCommand(path)
    const metadata = await CliClassMetadata.fromClass(class$)
    const info = CliCommandInfo.from(metadata)
    const yargs = new CliYargsCommand(await info.toPojo())
    await yargs.__dump()
  }
}

cliYargs({
  name: 'CliTool',
  description: 'My funky cli packaging tool',
  commands: {
    http: '@kingjs/cli-http',
    reflect: {
      parameters: {
        module: 'Name of module',
        path: 'Path of command',
      },
      defaults: [REQUIRED, []],
      description: 'Reflect on command metadata',
      commands: { 
        raw, 
        md, 
        info, 
        yargs,
      }
    }
  }
}).then(async (yargs) => {
  const toolName = 'cli-tool'
  yargs = yargs
    .scriptName(toolName)
    .usage(`${toolName} <command> [options]`)
    .wrap(85)

  // const argv = await yargs.parse('http get --help'.split(' '))
  // const argv = await yargs.parse('--metadata$'.split(' '))
  // const argv = await yargs.parse('--info$'.split(' '))
  // const argv = await yargs.parse('--yargs$'.split(' '))
  // const argv = await yargs.parse('reflect md @kingjs/cli-http --metadata$'.split(' '))
  // const argv = await yargs.parse('reflect md @kingjs/cli-http --infos$'.split(' '))
  // const argv = await yargs.parse('reflect raw @kingjs/cli-http get'.split(' '))
  // const argv = await yargs.parse('reflect raw @kingjs/cli-http get --hierarchy'.split(' '))
  // const argv = await yargs.parse('reflect md @kingjs/cli-http get'.split(' '))
  // const argv = await yargs.parse('reflect yargs @kingjs/cli-http get'.split(' '))
  // const argv = await yargs.parse('reflect info @kingjs/cli-eval'.split(' '))
  // const argv = await yargs.parse('reflect info --metadata$'.split(' '))
  // const argv = await yargs.parse('reflect info cli'.split(' '))
  const argv = await yargs.parse(hideBin(process.argv))
  new argv._class(...argv._args)
})
