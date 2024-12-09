// Import required modules
import os from 'os'
import { EventEmitter } from 'events'
import spawnShell from './spawn-shell.mjs'
import spawnRestRequest from './spawn-rest-request.mjs'

const NEW_LINE = os.EOL

class Clippy extends EventEmitter {
  static isScript(content) {
    return content.startsWith('#!/clipboard/')
  }

  async processScript(script, signal) {
    const update = ({ output, error }) => {
      this.emit('update', { output, error })
    }

    const [firstLine, ...bodyLines] = (script.trimEnd() + NEW_LINE).split(NEW_LINE)
    const [shebang, ...args] = firstLine.trim().split(' ')
    const [_, _clipboard, command, ...route] = shebang.split('/')

    try {
      switch (command) {
        case 'shell':
          await this.processShellCommand(route, args, bodyLines, signal, update)
          break
        case 'throw':
          throw new Error('This is an error thrown for testing.')
        case 'rest':
          await this.processRestCommand(route, args, bodyLines, signal, update)
          break
        default:
          this.emit('failure', `Invalid command: ${command}`)
      }
    } catch (error) {
      this.emit('failure', `Error processing script: ${error.message}`)
    }

    this.emit('end')
  }

  async processShellCommand(route, args, bodyLines, signal, update) {
    try {
      const result = await spawnShell(route, args, bodyLines, signal, update)
      const { code, signal: exitSignal, error } = result

      if (code === 0) {
        if (!error) {
          this.emit('success', 'Shell command executed successfully')
        } else {
          this.emit('warning', 'Shell command executed successfully but wrote to stderr')
        }
      } else if (exitSignal) {
        this.emit('failure', `Shell command terminated by signal: ${exitSignal}`)
      } else {
        this.emit('failure', `Shell command exited with code: 0x${code.toString(16)}`)
      }
    } catch (error) {
      this.emit('failure', `Shell command failed to execute: ${error.message}`)
    }
  }

  async processRestCommand(route, args, bodyLines, signal, update) {
    try {
      const response = await spawnRestRequest(route, args, bodyLines, signal, update)
      const { status, error } = response

      if (status >= 200 && status < 300) {
        if (!error) {
          this.emit('success', `REST command executed successfully with status: ${status}`)
        } else {
          this.emit('warning', `REST command executed successfully with status: ${status}, but wrote to stderr`)
        }
      } else {
        this.emit('failure', `REST command failed with status: ${status}`)
      }
    } catch (error) {
      this.emit('failure', `REST command failed to execute: ${error.message}`)
    }
  }
}

export default Clippy
