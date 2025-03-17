#!/usr/bin/env node
import { CliCommand } from '@kingjs/cli-command'

export const Clippy = CliCommand.extend({
  name: 'Clippy',
  description: 'My funky cli',
  commands: {
    http: '@kingjs/cli-http',
    orb: '@kingjs/cli-orb',
    poll: '@kingjs/cli-poll-clipboard',
    eval: '@kingjs/cli-eval',
    spy: '@kingjs/cli-spy',
  }
})

export default Clippy