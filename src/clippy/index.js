#!/usr/bin/env node

import { CliShim } from '@kingjs/cli-loader'
import { CliBashShell, CliCmdShell } from '@kingjs/cli-shell'
import { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } from '@kingjs/cli-http'
import CliPollClipboard from '@kingjs/cli-poll-clipboard'

CliShim.run({
  http: {
    get: CliGet,
    post: CliPost,
    put: CliPut,
    delete: CliDelete,
    patch: CliPatch,
    head: CliHead
  },
  shell: {
    bash: CliBashShell,
    cmd: CliCmdShell,
    ps: CliCmdShell,
    wsl: CliCmdShell,
  },
  poll: CliPollClipboard
})

// ./src/clippy/index.js
// !#/clipboard/', descr