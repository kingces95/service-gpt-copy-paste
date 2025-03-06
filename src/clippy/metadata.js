foo = {
  name: '<root>',
  description: 'My funky cli',
  parameters: {
    help: { type: 'boolean', aliases: [ 'h' ] },
    version: { type: 'string', default$: '0.0' },
    verbose: { type: 'boolean', aliases: [ 'v' ] }
  },
  commands: {
    http: {
      description: 'Send a HTTP request',
      parameters: {
        url: { type: 'string', position: 0 },
        headers: { type: 'number', default$: 0, position: 1 },
        method: {
          type: 'string',
          choices: [ 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD' ],
          default$: 'GET'
        }
      },
      commands: {
        get: { description: 'Perform an http GET request' },
        post: { description: 'Perform an http POST request' },
        put: { description: 'Perform an http PUT request' },
        delete: { description: 'Perform an http DELETE request' },
        patch: { description: 'Perform an http PATCH request' },
        head: { description: 'Perform an http HEAD request' }
      }
    },
    orb: {
      description: 'Tool for rendering status to tty',
      parameters: {
        cpuHot: { type: 'number', default$: 80 },
        memHot: { type: 'number', default$: 90 }
      }
    },
    poll: {
      description: 'Poll clipboard content',
      parameters: {
        stdis: { type: 'boolean' },
        stdisFd: { type: 'number', default$: 1 },
        pollMs: { type: 'number', default$: 200 },
        errorRate: { type: 'number', default$: 0.01 },
        errorMs: { type: 'number', default$: 1000 },
        writeError: { type: 'boolean' },
        prefix: { type: 'string', default$: '!#/clipboard/' }
      }
    },
    eval: {
      description: 'Evaluate a shell command',
      parameters: {
        exe: { type: 'string', position: 0 },
        args: { type: 'array', position: 1 },
        shell: { type: 'string', choices: [ 'bash', 'cmd.exe' ] }
      },
      commands: {
        bash: { description: 'Evaluate a bash shell command' },
        cmd: { description: 'Evaluate a cmd shell command' }
      }
    },
    moo: {
      description: 'My moo command',
      commands: {
        foo: {
          description: 'My foo command',
          commands: {
            orb: {
              description: 'Tool for rendering status to tty',
              parameters: {
                cpuHot: { type: 'number', default$: 80 },
                memHot: { type: 'number', default$: 90 }
              }
            }
          }
        }
      }
    }
  }
}