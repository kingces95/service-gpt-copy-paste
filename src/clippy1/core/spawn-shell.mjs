// Import required modules
import os from 'os'
import { spawn } from 'child_process'

const NEW_LINE_UNIX = '\n'
const NEW_LINE = os.EOL

function normalize(route, args, newLine = NEW_LINE) {
  switch (route) {
    case 'ps':
      return normalize('cmd.exe', ['powershell', '-Command', '-', ...args], NEW_LINE_UNIX)

    case 'wsl':
      return normalize('cmd.exe', ['wsl', ...args], NEW_LINE_UNIX)

    case 'bash':
      if (os.platform() === 'win32') {
        return normalize('wsl', ['bash', ...args], NEW_LINE_UNIX)
      }
      return { shell: 'bash', args, newLine: NEW_LINE_UNIX }

    case 'cmd':
    case 'cmd.exe':
      if (args[0] == 'wsl')
        newLine = NEW_LINE_UNIX
      return { shell: 'cmd.exe', args, newLine }

    default:
      throw new Error(`No such route: ${route}`)
  }
}

export default async function spawnShell(route, args, bodyLines, signal, write) {
  const { shell, args: normalizedArgs, newLine } = normalize(route[0], args)

  return new Promise((resolve, reject) => {
    try {
      const child = spawn(normalizedArgs[0], normalizedArgs.slice(1), {
        shell: shell,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'] // Use pipes for stdin, stdout, and stderr
      })

      let hasError = false

      // Write to child process stdin if bodyLines are provided
      if (bodyLines) {
        child.stdin.write(bodyLines.join(newLine))
        child.stdin.end() // Explicitly close stdin to send EOF
      }

      signal.addEventListener('abort', () => {
        if (!child.killed) {
          child.kill('SIGINT')
        }
      })

      child.stdout.on('data', (data) => write({ output: data.toString() }))
      child.stderr.on('data', (data) => {
        hasError = true
        write({ error: data.toString() })
      })

      const stdoutPromise = new Promise((resolve) => {
        child.stdout.on('end', resolve)
      })

      const stderrPromise = new Promise((resolve) => {
        child.stderr.on('end', resolve)
      })

      child.on('close', async (code, signal) => {
        await Promise.all([stdoutPromise, stderrPromise])
        resolve({ code, signal, error: hasError })
      })
    } catch (error) {
      reject(error)
    }
  })
}
