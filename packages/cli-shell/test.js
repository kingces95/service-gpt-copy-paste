import assert from 'node:assert/strict'
import { CliShell } from './index.js'

const $ = new CliShell()

async function test() {
  const promise = $(async $ => {
    try {
      while (true) {
        const line$ = $.read()
        const line = await line$
        if (!line) break
        console.error(line)
      }
      return
    } catch (err) {
      console.error(err)
    } 
    return
  })(['hello','world'])//.__dump()
  await promise
  return
}

try {
  await test()
} catch (err) {
  console.error(err)
  process.exit(1)
}
