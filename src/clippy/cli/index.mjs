import ClippyService from '../core/clippy-service.mjs'
import Terminal from '../core/terminal.mjs'
import AwaitProxy from '../core/await-proxy.mjs'

const DELAY_MS = 200

async function main() {
  ClippyService.start((service) => {
    const terminal = new AwaitProxy(new Terminal(), {
      throttle: { renderUpdate: { ms: DELAY_MS } },
      end: [ 'renderSuccess', 'renderWarning', 'renderFailure' ]
    })

    service.on('listening', () => terminal.renderStart('Listening...'))
    service.on('interrupt', () => terminal.renderInterrupt('Interrupting...'))
    service.on('processing', () => terminal.renderUpdate({ state: 'Processing...' }))
    service.on('data', (data) => terminal.renderUpdate(data))
    service.on('success', (message) => terminal.renderSuccess(message))
    service.on('warning', (message) => terminal.renderWarning(message))
    service.on('failure', (message) => terminal.renderFailure(message))
    service.on('error', (error) => console.error('Error:', error?.stack || error))
  })
}

main().catch((error) => {
  console.error('Failed to start CLI app:', error)
})
