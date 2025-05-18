import { Writable, Readable } from 'stream'
import { Draft } from '@kingjs/draft'
import { CliShell } from '@kingjs/cli-shell'
import { 
  CliResource,
  CliBorrowedReadableResource,
  CliBorrowedWritableResource,
  CliHereStringResource,
  CliHereDocResource,
  CliPathReadableResource,
  CliPathWritableResource,
  CliNullReadableResource,
  CliNullWritableResource,
  CliIterableSubstitutionResource,
} from '@kingjs/cli-resource'

export class CliShellDraft extends Draft {

  #__slots

  constructor(parent) {
    const slots = []

    function resourceFromInputRedirect(producer) {
      // fd redirect; e.g. echo 0<&3
      if (producer instanceof Readable) 
        return new CliBorrowedReadableResource(producer)

      // path redirect to /dev/null; e.g. echo < /dev/null
      if (producer === '' || producer == null)
        return new CliNullReadableResource()

      // path redirect; e.g. echo < file.txt
      if (typeof producer === 'string') 
        return new CliPathReadableResource(
          parent.resolve(producer), null, producer)

      // here-string; e.g. echo <<< "hello world"
      if (Buffer.isBuffer(producer)) 
        return new CliHereStringResource(producer)

      // here-doc; e.g. echo <<EOF "hello world" EOF
      if (Array.isArray(producer))
        return new CliHereDocResource(producer)

      // process substitution; e.g. echo <(echo "hello world")
      if (producer?.[Symbol.asyncIterator] || producer?.[Symbol.iterator])
        return new CliIterableSubstitutionResource(producer)

      return null
    }

    function resourceFromOutputRedirect(consumer) {
      // fd redirect; e.g. echo 1>&3
      if (consumer instanceof Writable) 
        return new CliBorrowedWritableResource(consumer)

      // path redirect to bin-bucket; e.g. echo > /dev/null
      if (consumer === '' || consumer == null)
        return new CliNullWritableResource()

      // path redirect; e.g. echo > file.txt
      if (typeof consumer === 'string') 
        return new CliPathWritableResource(
          parent.resolve(consumer), null, consumer)

      return null
    }

    function redirect(info, redirection) {
      const { isInput } = info

      // substituion redirection; 
      // e.g. echo 0<&3
      if (typeof redirection == 'number')
        return slots[redirection] ?? parent.slots[redirection]?.borrow()

      // simple redirection; e.g. echo > file.txt
      const resource = isInput ? 
        resourceFromInputRedirect(redirection) :
        resourceFromOutputRedirect(redirection)
      if (resource) return resource
  
      throw new Error([
        `Invalid redirection type: ${redirection.constructor.name}.`
      ])
    }

    super({
      revise(info, redirection, { supplant }) {

        // supplant slot
        const { slot } = info
        const resource = slots[slot]
        if (resource instanceof CliResource) 
          supplant(resource)

        // redirect slot
        slots[slot] = 
          redirection instanceof CliResource ? redirection :
            redirect(info, redirection)
      },
      publish() {
        return new CliShell({ parent, redirects: slots })
      }
    })

    this.#__slots = slots
  }

  get __slots() { 
    // convert from array to pojo with slot indices as keys
    return this.#__slots.reduce((o, resource, slot) => {
      o[slot] = resource
      return o
    }, {})
  }
}
