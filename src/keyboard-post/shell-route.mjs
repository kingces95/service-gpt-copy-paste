// Import required modules
import os from 'os'
import { spawn } from 'child_process'

const NEW_LINE_UNIX = '\n'
const NEW_LINE = os.platform() === 'win32' ? os.EOL : NEW_LINE_UNIX

async function handleShellRoute(shell, command, bodyLines, sigint, write) {
  return new Promise((resolve, reject) => {
    try {
      const [cmd, ...args] = command.split(' ')

      const child = spawn(cmd, args, {
        shell: shell,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'] // Use pipes for stdin, stdout, and stderr
      })

      // Write to child process stdin if bodyLines are provided
      if (bodyLines) {
        child.stdin.write(bodyLines)
        child.stdin.end() // Explicitly close stdin to send EOF
      }

      // Stream stdout and pass chunks to write function
      child.stdout.on('data', async (data) => {
        await write({ output: data.toString() })
      })

      // Stream stderr and pass chunks to write function
      child.stderr.on('data', async (data) => {
        await write({ error: data.toString() })
      })

      const stdoutPromise = new Promise((resolve) => {
        child.stdout.on('end', resolve)
      })

      const stderrPromise = new Promise((resolve) => {
        child.stderr.on('end', resolve)
      })

      sigint.addEventListener('abort', () => {
        if (!child.killed) {
          child.kill('SIGINT')
        }
      })
      
      child.on('close', async (code, signal) => {
        await Promise.all([stdoutPromise, stderrPromise])
        resolve({ code, signal })
      })
    } catch (error) {
      reject(error)
    }
  })
}

function normalizeShellRoute(shellRoute, commandRest, newLine = NEW_LINE) {
  switch (shellRoute) {
    case 'ps':
      // wsl is launched from a cmd.exe shell
      return normalizeShellRoute('cmd.exe', ['powershell', '-Command', '-', ...commandRest], NEW_LINE_UNIX)
      
    case 'wsl':
      // wsl is launched from a cmd.exe shell
      return normalizeShellRoute('cmd.exe', ['wsl', ...commandRest], NEW_LINE_UNIX)
      
    case 'bash':
      // bash is launched from a wsl shell
      if (os.platform() === 'win32')
        return normalizeShellRoute('wsl', ['bash', ...commandRest], NEW_LINE_UNIX)
      
      return { shell: 'bash', commandRest, NEW_LINE_UNIX }
    case 'cmd':
    case 'cmd.exe':
      return { shell: 'cmd.exe', commandRest, newLine }
      
    default:
      return { error: `No such shell route: shell/${shellRoute}` }
  }
}

export { handleShellRoute, normalizeShellRoute }
