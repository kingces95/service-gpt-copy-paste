// Import required modules
import os from 'os';
import clipboardy from 'clipboardy';
import axios from 'axios';
import ora from 'ora';
import { spawn } from 'child_process';

// Enum for command types
const CommandType = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  THROW: 'throw',
  SHELL: 'shell',
};

const NEW_LINE = os.EOL;
const NEW_LINE_UNIX = '\n';

// Spinner for logging
const spinner = ora({ text: 'Waiting for commands...', spinner: 'dots' }).start();

// Flag to track command processing
let processingCommand = false;

// Utility functions for reporting results
async function reportSuccess(message, body) {
  spinner.succeed(message);
  try {
    await clipboardy.write(body);
  } catch (clipboardError) {
    console.error('Failed to write to clipboard:', clipboardError.message);
  }
  spinner.text = 'Waiting for commands...';
  spinner.start();
  processingCommand = false; // Unlock clipboard checking
}

async function reportFailure(message, body) {
  spinner.fail(message);
  if (body) {
    console.error(body);
  }
  const clipboardContent = [message, body].filter(Boolean).join(NEW_LINE);
  try {
    await clipboardy.write(clipboardContent);
  } catch (clipboardError) {
    console.error('Failed to write to clipboard:', clipboardError.message);
  }
  spinner.text = 'Waiting for commands...';
  spinner.start();
  processingCommand = false; // Unlock clipboard checking
}

// Handlers for different command types
async function handleWebCommand(method, url, body) {
  try {
    spinner.text = `Processing...`;
    const response = await axios({
      method,
      url,
      data: body,
      transformResponse: [(data) => data], // Disable default serialization
    });
    await reportSuccess(`Web request successful: ${response.status}`, response.data);
  } catch (error) {
    const formattedErrorBody = error.response ? error.response.data : '';
    await reportFailure(`Web request failed: ${error.message}`, formattedErrorBody);
  }
}

async function handleThrowCommand() {
  spinner.text = 'Processing throw command...';
  throw new Error('This is a test error for handling purposes');
}

async function handleShellCommand(shell, command, bodyLines) {
  try {
    spinner.text = `Processing...`;
    const [cmd, ...args] = command.split(' ');

    const child = spawn(cmd, args, {
      shell: shell || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash'),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'], // Use pipes for stdin, stdout, and stderr
    });

    let stdout = '';
    let stderr = '';
    let stdoutEnded = false;
    let stderrEnded = false;
    let closed = false;

    // Handle child process errors
    child.on('error', async (error) => {
      await reportFailure(`Shell command failed: ${error.message}`, error.stack);
    });

    // Write to child process stdin if bodyLines are provided
    if (bodyLines) {
      child.stdin.write(bodyLines);
      child.stdin.end(); // Explicitly close stdin to send EOF
    }

    // Accumulate stdout data
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Mark when stdout ends
    child.stdout.on('end', () => {
      stdoutEnded = true;
      maybeResolve();
    });

    // Accumulate stderr data
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Mark when stderr ends
    child.stderr.on('end', () => {
      stderrEnded = true;
      maybeResolve();
    });

    // Handle process close event
    child.on('close', async (code) => {
      closed = true;
      child.exitCode = code;
      maybeResolve();
    });

    // Ensure all streams have ended before resolving
    async function maybeResolve() {
      if (stdoutEnded && stderrEnded && closed) {
        if (child.exitCode === 0) {
          await reportSuccess('Shell command executed successfully', stdout);
        } else {
          await reportFailure(`Shell command completed with errors: ${stderr}`, stderr);
        }
      }
    }
  } catch (error) {
    await reportFailure(`Shell command failed: ${error.message}`, error.stack);
  }
}

// Monitor clipboard input
setInterval(async () => {
  if (processingCommand) {
    return; // Skip if already processing a command
  }

  try {
    let clipboard = await clipboardy.read();
    if (!clipboard.startsWith('#!/clipboard/')) {
      return;
    }

    // Lock processing
    processingCommand = true;

    // Clear the clipboard and update spinner
    try {
      await clipboardy.write('Processing...');
    } catch (clipboardError) {
      console.error('Failed to clear clipboard:', clipboardError.message);
      processingCommand = false;
      return;
    }

    const [firstLine, ...bodyLines] = (clipboard.trimEnd() + NEW_LINE).split(NEW_LINE);
    const [shebang, ...rest] = firstLine.trim().split(' ');
    const [_, _clipboard, commandType, ...shellRest] = shebang.split('/');
    const shell = shellRest.join('/');

    switch (commandType) {
      case CommandType.GET:
      case CommandType.POST:
      case CommandType.PUT: {
        const method = commandType.toUpperCase();
        const url = rest[0];
        const body = bodyLines.join(NEW_LINE);
        await handleWebCommand(method, url, body);
        break;
      }
      case CommandType.THROW: {
        await handleThrowCommand();
        break;
      }
      case CommandType.SHELL: {
        let newLine = NEW_LINE
        let osShell = shell
        
        if (os.platform() === 'win32') {
          if (osShell == 'bash') {
            osShell = 'wsl'
            rest.unshift('bash')
          }
          if (osShell === 'wsl') {
            osShell = 'cmd.exe'
            rest.unshift('wsl')
          }
          if (rest[0] == 'wsl') {
            newLine = NEW_LINE_UNIX
          }
        }
        
        const command = rest.join(' ');
        const body = bodyLines.join(newLine)
        await handleShellCommand(osShell, command, body);
        break;
      }
      default:
        await reportFailure(`Unknown command type: '${firstLine}'`);
        break;
    }
  } catch (error) {
    if (error.message.includes('Access is denied')) {
      console.error('Clipboard access error: Access is denied. Please check permissions.');
    } else {
      await reportFailure(`Error reading clipboard: ${error.message}`, error.stack);
    }
    processingCommand = false; // Unlock clipboard checking
  }
}, 1000); // Check every second

// Exit handler
process.on('SIGINT', () => {
  spinner.stop();
  console.log('Clipboard monitoring stopped.');
  process.exit(0);
});
