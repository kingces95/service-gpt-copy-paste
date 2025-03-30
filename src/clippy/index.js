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
  },
  groups: [
    ['Global', 
      '@kingjs/cli-command'],
    ['I/O', 
      '@kingjs/cli-command, CliStdStream'],
    ['Polling', 
      '@kingjs/cli-rx-poller'],
    ['Daemon', 
      '@kingjs/cli-daemon, CliDaemonState',
      '@kingjs/cli-daemon, CliPulse'],
  ]
})
