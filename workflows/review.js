export const meta = {
  name: 'review',
  description: 'Review a pull request by dimension and keep only findings that survive adversarial checks',
  whenToUse: 'Reviewing a pull request before it merges, on its own or as part of the factory. Pass { pullRequest, repository?, request? } as args.',
  phases: [
    { title: 'Scope', detail: 'work out which dimensions the change touches', model: 'haiku' },
    { title: 'Find', detail: 'one reviewer per dimension, repeated until a round finds nothing new' },
    { title: 'Verify', detail: 'skeptics try to refute each finding, escalating to three only when needed', model: 'sonnet' },
  ],
}

const MAX_ROUNDS = 2

const pr = args.pullRequest
const where = `${args.repository ? `Repository ${args.repository}, p` : 'P'}ull request #${pr}.` +
  (args.request ? `\nWhat it was asked to do: ${args.request}` : '')

const SCOPE = {
  type: 'object',
  required: ['branch', 'code', 'interface', 'summary'],
  properties: {
    branch: { type: 'string' },
    code: { type: 'boolean' },
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
  'whether it changes code at all rather than only docs or text, whether it changes anything a user sees or interacts with, ' +
  'and a two-sentence summary of the change.',
  { label: 'scope', schema: SCOPE, model: 'haiku', effort: 'low' },
)

const DIMENSIONS = [
  { key: 'code', how: `Invoke the code-review skill with the Skill tool on pull request #${pr} and build your findings from its output, instead of reviewing by hand. Only if that skill is unavailable, review the diff yourself and say so.` },
  ...(scope.code ? [
    { key: 'security', how: 'Invoke the security-review skill with the Skill tool on the checked-out code and build your findings from its output.' },
  ] : []),
  ...(scope.interface ? [
    { key: 'ux', how: 'Review it as a user would use it: whether it does what they expect, including empty, error and loading states.' },
    { key: 'ui', how: 'Review its interface: layout, spacing, consistency with the rest of the product, and accessibility.' },
  ] : []),
]

const key = f => `${f.file}:${f.line}`

const skeptic = (f, i) => agent(
  `${where}\n\nA reviewer reported this problem on branch ${scope.branch}: ${JSON.stringify(f)}\n\n` +
  'Fetch the branch and read the code with git show, without checking it out. Try to refute the finding: ' +
  'it is real only if a realistic input or caller makes it go wrong and the fix is worth its code. ' +
  'If you are unsure, call it refuted.',
  { label: `skeptic ${i}: ${key(f)}`, phase: 'Verify', schema: VERDICT, model: 'sonnet', effort: 'medium' },
)
const holds = v => v && !v.refuted

const seen = new Set()
const confirmed = []
let refuted = 0
let active = DIMENSIONS

for (let round = 1; round <= MAX_ROUNDS; round++) {
  const known = [...seen].join(', ') || 'none yet'
  const results = await parallel(active.map(d => () => agent(
    `${where}\nSummary: ${scope.summary}\n\nRun git fetch origin ${scope.branch} and git checkout --detach FETCH_HEAD in your worktree, since the builder already has the branch checked out. ${d.how} ` +
    `Report only real problems this change introduces in the ${d.key} dimension, each with the file, line, what goes wrong and the fix. ` +
    'A problem is real only if a realistic input or caller makes it go wrong and the fix is worth its code, so leave out style, ' +
    'hypotheticals and anything the request did not ask for. ' +
    `Already reported, so skip these: ${known}. Don't edit anything.`,
    { label: `${d.key} ${round}`, phase: 'Find', isolation: 'worktree', schema: FINDINGS },
  ).then(r => ({ d, findings: r ? r.findings : [] }))))

  // Only a dimension that turned up something new gets another round.
  const fresh = []
  const productive = new Set()
  for (const { d, findings } of results.filter(Boolean)) {
    for (const f of findings) {
      if (seen.has(key(f))) continue
      seen.add(key(f))
      fresh.push(f)
      productive.add(d)
    }
  }
  active = active.filter(d => productive.has(d))
  if (!fresh.length) break

  // One skeptic first; only a finding that survives it gets two more, and needs one of them to agree.
  const judged = await parallel(fresh.map(f => async () => {
    if (!holds(await skeptic(f, 1))) return { f, real: false }
    const more = await parallel([2, 3].map(i => () => skeptic(f, i)))
    return { f, real: more.some(holds) }
  }))
  judged.forEach(j => j.real ? confirmed.push(j.f) : refuted++)
  log(`round ${round}: ${fresh.length} new, ${confirmed.length} confirmed so far, ${refuted} refuted`)
  if (round === MAX_ROUNDS) log(`stopped after ${MAX_ROUNDS} rounds; the last round still found new problems`)
}

return { pullRequest: pr, branch: scope.branch, dimensions: DIMENSIONS.map(d => d.key), findings: confirmed, refuted }
