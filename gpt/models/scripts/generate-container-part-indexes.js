import {
  containers,
  roles,
  support,
} from '../data/container-part-indexes.data.js'

const reports = new Map([
  ['members', emitMembers],
  ['member-index', emitMemberIndex],
  ['lexeme-index', emitLexemeIndex],
  ['all', emitAll],
])

const labelWidth = 34
const columnWidth = 4

function header(title) {
  const lines = []

  for (let i = 0; i < containers.length; i++) {
    const cells = containers.map((name, j) => {
      if (j < i) return '|'
      if (j === i) return name
      return ''
    })

    lines.push(' '.repeat(labelWidth) + formatCells(cells))
  }

  lines.push(title.padEnd(labelWidth) + formatCells(containers.map(() => '|')))
  return lines
}

function formatCells(cells) {
  return cells.map(cell => cell.padEnd(columnWidth)).join('').trimEnd()
}

function mark(containerSet, container) {
  return containerSet.has(container) ? 'x' : '-'
}

function markerRow(label, containerSet) {
  return label.padEnd(labelWidth) +
    formatCells(containers.map(container => mark(containerSet, container)))
}

function toSet(values) {
  return new Set(values)
}

function addAll(map, key, values) {
  let set = map.get(key)
  if (!set)
    map.set(key, set = new Set())

  for (const value of values)
    set.add(value)
}

function splitCamel(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word[0].toUpperCase() + word.slice(1))
}

function collectMemberContainers() {
  const memberContainers = new Map()

  for (const [, parts] of roles)
    for (const [part, members] of parts)
      for (const member of members)
        addAll(memberContainers, member, support[part] ?? [])

  return memberContainers
}

function emitMembers() {
  const lines = [
    '### Members',
    '',
    '```txt',
    'Members',
    '├─ set: public Part members',
    '├─ transform: member -> (member, ~role, decl Part, container*)',
    '├─ pivot: ~role, decl Part',
    '└─ display: member rows by container columns',
    '```',
    '',
    '```txt',
    'Members',
    '',
    ...header('Members \\ Containers'),
    '',
  ]

  for (const [role, parts] of roles) {
    lines.push(role)

    for (let i = 0; i < parts.length; i++) {
      const [part, members] = parts[i]
      const partBranch = i === parts.length - 1 ? '└─' : '├─'
      const memberPrefix = i === parts.length - 1 ? '   ' : '│  '
      const containerSet = toSet(support[part] ?? [])

      lines.push(`${partBranch} ${part}`)

      for (let j = 0; j < members.length; j++) {
        const branch = j === members.length - 1 ? '└─' : '├─'
        lines.push(markerRow(`${memberPrefix}${branch} ${members[j]}`, containerSet))
      }
    }

    lines.push('')
  }

  if (lines.at(-1) === '')
    lines.pop()

  lines.push('```')
  return lines.join('\n')
}

function emitMemberIndex() {
  const memberContainers = collectMemberContainers()
  const lines = [
    '### Member Index',
    '',
    '```txt',
    'Member Index',
    '├─ set: public container members',
    '├─ transform: member -> (member, container*)',
    '├─ pivot: member',
    '└─ display: member rows by container columns',
    '```',
    '',
    '```txt',
    'Member Index',
    '',
    ...header('Members \\ Containers'),
    '',
  ]

  for (const member of [...memberContainers.keys()].sort())
    lines.push(markerRow(member, memberContainers.get(member)))

  lines.push('```')
  return lines.join('\n')
}

function emitLexemeIndex() {
  const memberContainers = collectMemberContainers()
  const lexemes = new Map()

  for (const member of [...memberContainers.keys()].sort())
    for (const lexeme of splitCamel(member)) {
      let members = lexemes.get(lexeme)
      if (!members)
        lexemes.set(lexeme, members = [])

      members.push(member)
    }

  const lines = [
    '### Lexeme Index',
    '',
    '```txt',
    'Lexeme Index',
    '├─ set: public container member names',
    '├─ transform: name -> (name, lexeme*, container*)',
    '├─ pivot: lexeme',
    '└─ display: name rows by container columns',
    '```',
    '',
    '```txt',
    'Lexeme Index',
    '',
    ...header('Lexemes \\ Containers'),
    '',
  ]

  for (const lexeme of [...lexemes.keys()].sort()) {
    const members = [...new Set(lexemes.get(lexeme))].sort()
    lines.push(lexeme)

    for (let i = 0; i < members.length; i++) {
      const branch = i === members.length - 1 ? '└─' : '├─'
      lines.push(markerRow(
        `${branch} ${members[i]}`,
        memberContainers.get(members[i]),
      ))
    }

    lines.push('')
  }

  if (lines.at(-1) === '')
    lines.pop()

  lines.push('```')
  return lines.join('\n')
}

function emitAll() {
  return [
    emitMembers(),
    emitMemberIndex(),
    emitLexemeIndex(),
  ].join('\n\n')
}

const report = process.argv[2] ?? 'all'
const emit = reports.get(report)

if (!emit) {
  console.error(`Unknown report: ${report}`)
  console.error(`Expected one of: ${[...reports.keys()].join(', ')}`)
  process.exitCode = 1
} else {
  console.log(emit())
}
