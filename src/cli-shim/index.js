#!/usr/bin/env node
import { cliYargs } from '@kingjs/cli-yargs'
import { NodeName } from '@kingjs/node-name'

const [node, script, name, ...args] = process.argv
const tool = await NodeName.from(name).importObject()

cliYargs(tool).then(async (yargs) => {
  const toolName = 'cli-shim'
  yargs = yargs
    .scriptName(toolName)
    .usage(`${toolName} <command> [options]`)
    .wrap(85)
  const argv = await yargs.parse(args)
  new argv._class(...argv._args)
})
