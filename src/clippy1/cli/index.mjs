import Service from '../core/service.mjs'
import Terminal from '../core/terminal.mjs'
import AwaitProxy from '../core/await-proxy.mjs'

const DELAY_MS = 200

async function main() {
  const service = new Service()

  let terminal = null
  let interrupt = null

  service.on('listening', 
    () => terminal = new AwaitProxy(
      new Terminal(), {
        throttle: { renderUpdate: { ms: DELAY_MS } },
        end: ['renderSuccess', 'renderWarning', 'renderFailure']
      })
    )

  service.on('listening', () => interrupt = null)
  service.on('processing', ({ abort }) => interrupt = abort)

  service.on('listening', () => terminal.renderStart('Listening...'))
  service.on('processing', () => terminal.renderUpdate({ state: 'Processing...' }))
  service.on('data', (data) => terminal.renderUpdate(data))
  service.on('success', (message) => terminal.renderSuccess(message))
  service.on('warning', (message) => terminal.renderWarning(message))
  service.on('failure', (message) => terminal.renderFailure(message))
  service.on('error', (error) => console.error(error?.stack || error))

  process.on('SIGINT', async () => {
    terminal.renderInterrupt('Interrupting...')
    if (interrupt) {
      interrupt()
      return true 
    } 
    process.exit(0)
  })

  service.start()
}

main().catch((error) => {
  console.error(error?.stack || error)
})
