import clipboardy from 'clipboardy'

export default class Clipboard {
  async renderStart() {
    await clipboardy.write('') // Clear the clipboard
  }

  async renderUpdate({ output = [], error = [] }) {
    // Format the clipboard content
    const formattedOutput = [
      output.join(''),
      error.length > 0 ? '=== Error Output ===' : '',
      error.join('')
    ]
      .filter(Boolean)
      .join('\n')

    // Update the clipboard with the new formatted content
    if (formattedOutput) {
      await clipboardy.write(formattedOutput)
    }
  }
}
