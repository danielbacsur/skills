export const meta = {
  name: 'review',
  description: 'Review a pull request by dimension and keep only findings that survive adversarial checks',
  whenToUse: 'Reviewing a pull request before it merges, on its own or as part of the factory. Pass { pullRequest, repository?, request? } as args.',
  phases: [
    { title: 'Scope', detail: 'work out which dimensions the change touches' },
    { title: 'Find', detail: 'one reviewer per dimension, repeated until a round finds nothing new' },
    { title: 'Verify', detail: 'three skeptics try to refute each finding' },
  ],
}

const MAX_ROUNDS = 3
const SKEPTICS = 3

const pr = args.pullRequest
const where = `${args.repository ? `Repository ${args.repository}, p` : 'P'}ull request #${pr}.` +
  (args.request ? `\nWhat it was asked to do: ${args.request}` : '')

const SCOPE = {
  type: 'object',
  required: ['branch', 'interface', 'summary'],
  properties: {
    branch: { type: 'string' },
    interface: { type: 'boolean' },
    summary: { type: 'string' },
  },
}

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'problem', 'fix'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['refuted', 'reason'],
  properties: { refuted: { type: 'boolean' }, reason: { type: 'string' } },
}

phase('Scope')
const scope = await agent(
  `${where}\n\nRead the pull request and its diff against the main branch. Return its head branch, ` +
  'whether it changes anything a user sees or interacts with, and a two-sentence summary of the change.',
  { label: 'scope', schema: SCOPE },
)

const DIMENSIONS = [
  { key: 'code', how: `Run the code-review skill on pull request #${pr}.` },
  { key: 'security', how: 'Run the security-review skill on the checked-out branch.' },
  ...(scope.interface ? [
    { key: 'ux', how: 'Review it as a user would use it: whether it does what they expect, including empty, error and loading states.' },
    { key: 'ui', how: 'Review its interface: layout, spacing, consistency with the rest of the product, and accessibility.' },
  ] : []),
]

const key = f => `${f.file}:${f.line}`
const seen = new Set()
const confirmed = []
let refuted = 0

for (let round = 1; round <= MAX_ROUNDS; round++) {
  const known = [...seen].join(', ') || 'none yet'
  const found = (await parallel(DIMENSIONS.map(d => () => agent(
    `${where}\nSummary: ${scope.summary}\n\nCheck out ${scope.branch} in your worktree. ${d.how} ` +
    `Report only real problems this change introduces in the ${d.key} dimension, each with the file, line, what goes wrong and the fix. ` +
    `Already reported, so skip these: ${known}. Don't edit anything.`,
    { label: `${d.key} ${round}`, phase: 'Find', isolation: 'worktree', schema: FINDINGS },
  )))).filter(Boolean).flatMap(r => r.findings)

  const fresh = found.filter(f => !seen.has(key(f)))
  fresh.forEach(f => seen.add(key(f)))
  if (!fresh.length) break

  const judged = await parallel(fresh.map(f => () =>
    parallel(Array.from({ length: SKEPTICS }, (_, i) => () => agent(
      `${where}\n\nA reviewer reported this problem on branch ${scope.branch}: ${JSON.stringify(f)}\n\n` +
      'Fetch the branch and read the code with git show, without checking it out. Try to refute the finding: ' +
      'it is real only if a realistic input or caller makes it go wrong and the fix is worth its code. ' +
      'If you are unsure, call it refuted.',
      { label: `skeptic ${i + 1}: ${key(f)}`, phase: 'Verify', schema: VERDICT },
    ))).then(votes => ({ f, real: votes.filter(v => v && !v.refuted).length * 2 > SKEPTICS })),
  ))
  judged.forEach(j => j.real ? confirmed.push(j.f) : refuted++)
  log(`round ${round}: ${fresh.length} new, ${confirmed.length} confirmed so far, ${refuted} refuted`)
  if (round === MAX_ROUNDS) log(`stopped after ${MAX_ROUNDS} rounds; the last round still found new problems`)
}

return { pullRequest: pr, branch: scope.branch, dimensions: DIMENSIONS.map(d => d.key), findings: confirmed, refuted }
