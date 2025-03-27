#!/usr/bin/env node
import { CliCommand } from '@kingjs/cli-command'

export const Clippy = CliCommand.extend({
  name: 'Clippy',
  description: 'My funky cli',
  commands: {
    poll: '@kingjs/cli-poll-clipboard',
    http: '@kingjs/cli-http',
    orb: '@kingjs/cli-orb',
    eval: '@kingjs/cli-eval',
    spy: '@kingjs/cli-spy',
    name: '@kingjs/cli-node-name',
  }
})

export default Clippy