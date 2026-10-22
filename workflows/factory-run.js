export const meta = {
  name: 'factory-run',
  description: 'Build, review and decide factory jobs in parallel',
  whenToUse: 'Started by the factory skill, with the board and jobs as args.',
  phases: [
    { title: 'Build', detail: 'implement each job on its own pull request' },
    { title: 'Review', detail: 'code and security review, every finding verified' },
    { title: 'Decide', detail: 'merge trivial work, leave the rest waiting' },
  ],
}

const ROUNDS = 2

const { board, jobs } = args

const BUILT = {
  type: 'object',
  required: ['pullRequest', 'branch', 'summary'],
  properties: {
    pullRequest: { type: 'integer' },
    branch: { type: 'string' },
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
        required: ['file', 'problem', 'fix'],
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
  required: ['real', 'reason'],
  properties: { real: { type: 'boolean' }, reason: { type: 'string' } },
}

const DECISION = {
  type: 'object',
  required: ['column', 'reason'],
  properties: {
    column: { type: 'string', enum: ['Done', 'Waiting'] },
    reason: { type: 'string' },
  },
}

const name = job => job.pullRequest
  ? `${job.repository}#${job.pullRequest}`
  : job.issue ? `${job.repository}#${job.issue}` : job.request.slice(0, 40)

const context = job => [
  `Repository: ${job.repository}.`,
  `Board: GitHub project ${board.number} owned by ${board.owner}.`,
  job.issue ? `Issue: #${job.issue}, whose card is the job's card.` : '',
  job.pullRequest ? `Pull request: #${job.pullRequest}. This is a rework job.` : '',
  `Request: ${job.request}`,
].filter(Boolean).join('\n')

const review = (job, built, kind) => agent(
  `${context(job)}\nBranch: ${built.branch}, pull request #${built.pullRequest}.\n\n` +
  `Check the branch out in your worktree and run the ${kind} skill on its changes against the main branch. ` +
  `Return only real problems the change introduces, each with the file, line, what goes wrong and the fix. Don't edit anything.`,
  { label: `${kind}: ${name(job)}`, phase: 'Review', isolation: 'worktree', schema: FINDINGS },
)

const refute = (job, built, finding) => agent(
  `${context(job)}\nBranch: ${built.branch}, pull request #${built.pullRequest}.\n\n` +
  `A reviewer reported this problem: ${JSON.stringify(finding)}\n\n` +
  `Try to refute it by reading the code on the branch. It is real only if a realistic input or caller makes it go wrong ` +
  `and the fix is worth its code. If you are unsure, it is not real.`,
  { label: `verify: ${finding.file}`, phase: 'Review', schema: VERDICT },
)

const results = await pipeline(
  jobs,

  job => agent(
    `${context(job)}\n\n` +
    (job.pullRequest
      ? 'Rework the existing pull request on its own branch to address the request and any unresolved review comments on it.'
      : 'Build this job from the latest main branch and open its draft pull request.'),
    { label: `build: ${name(job)}`, phase: 'Build', agentType: 'skills:builder', isolation: 'worktree', schema: BUILT },
  ),

  async (built, job) => {
    if (!built) return null
    let left = []
    for (let round = 0; round <= ROUNDS; round++) {
      const found = (await parallel([
        () => review(job, built, 'code-review'),
        () => review(job, built, 'security-review'),
      ])).filter(Boolean).flatMap(r => r.findings)
      const verdicts = await parallel(found.map(f => () => refute(job, built, f)))
      left = found.filter((f, i) => verdicts[i] && verdicts[i].real)
      if (!left.length || round === ROUNDS) break
      await agent(
        `${context(job)}\nBranch: ${built.branch}, pull request #${built.pullRequest}.\n\n` +
        `Review round ${round + 1} found these problems: ${JSON.stringify(left)}\n\nFix them on the branch and push.`,
        { label: `fix ${round + 1}: ${name(job)}`, phase: 'Build', agentType: 'skills:builder', isolation: 'worktree' },
      )
    }
    if (left.length) log(`${name(job)}: ${left.length} findings left after ${ROUNDS} rounds`)
    return { ...built, left }
  },

  (reviewed, job) => reviewed && agent(
    `${context(job)}\nPull request: #${reviewed.pullRequest}.\nBuilder's summary: ${reviewed.summary}\n` +
    (reviewed.left.length ? `Findings left unfixed: ${JSON.stringify(reviewed.left)}\n` : 'No review findings are left.\n') +
    '\nDecide whether it merges on its own or waits for a human, and carry that out.',
    { label: `decide: ${name(job)}`, phase: 'Decide', agentType: 'skills:approver', schema: DECISION },
  ).then(decision => decision && { job: name(job), pullRequest: reviewed.pullRequest, ...decision }),
)

return results.map((r, i) => r || { job: name(jobs[i]), column: 'failed' })
