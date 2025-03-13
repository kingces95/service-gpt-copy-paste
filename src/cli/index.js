import { cliYargs } from '@kingjs/cli-yargs'
import { NodeName } from '@kingjs/node-name'
import { CliMetadataLoader } from '@kingjs/cli-metadata'
import { CliInfoLoader } from '@kingjs/cli-info'
import { CliYargsCommand } from '@kingjs/cli-yargs'

const REQUIRED = undefined

const metadata = {
  description: 'Dump command implementation metadata',
  handler: async function(module, path) {
    const nodeName = NodeName.from(module)
    const class$ = await nodeName.importObject()
    const command = await class$.getCommand(path)
    const metadataLoader = await CliMetadataLoader.load(command)
    await metadataLoader.__dump()
  }
}

const info = {
  description: 'Dump command metadata',
  handler: async function(module, path) {
    const nodeName = NodeName.from(module)
    const class$ = await nodeName.importObject()
    const command = await class$.getCommand(path)
    const metadataLoader = await CliMetadataLoader.load(command)
    const infoLoader = new CliInfoLoader(metadataLoader)
    await infoLoader.__dump()
  }
}

const yargs = {
  description: 'Dump yargs metadata',
  handler: async function(module, path) {
    const nodeName = NodeName.from(module)
    const class$ = await nodeName.importObject()
    const command = await class$.getCommand(path)
    const metadataLoader = await CliMetadataLoader.load(command)
    const infoLoader = new CliInfoLoader(metadataLoader)
    const yargsCommand = new CliYargsCommand(await infoLoader.toPojo())
    await yargsCommand.__dump()
  }
}

cliYargs({
  name: 'CliTool',
  description: 'My funky cli packaging tool',
  commands: {
    reflect: {
      parameters: {
        module: 'Name of module',
        path: 'Path of command',
      },
      defaults: [REQUIRED, []],
      description: 'Reflect on command metadata',
      commands: {
        metadata,
        info,
        yargs
      }
    }
  }
}).then(async (yargs) => {
  const toolName = 'cli-tool'
  yargs = yargs
    .scriptName(toolName)
    .usage(`${toolName} <command> [options]`)
    .wrap(90)

  // const argv = await yargs.parse('--metadata$'.split(' '))
  // const argv = await yargs.parse('--info$'.split(' '))
  // const argv = await yargs.parse('--yargs$'.split(' '))
  // const argv = await yargs.parse('reflect metadata @kingjs/cli-http --metadata$'.split(' '))
  // const argv = await yargs.parse('reflect metadata @kingjs/cli-http --infos$'.split(' '))
  const argv = await yargs.parse('reflect info @kingjs/cli-http get'.split(' '))
  // const argv = await yargs.parse(hideBin(process.argv))

  new argv._class(...argv._args)
})
