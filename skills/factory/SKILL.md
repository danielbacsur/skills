---
name: factory
description: Use whenever asked to run the factory, take the next issue from the backlog, or push a feature through spec, build, review and approval.
---

Keep all factory state on GitHub. Open issues are the backlog, and an open pull request is a job in progress. Don't write status files, backlogs or dashboards anywhere else; if something is worth keeping, it belongs in an issue, a pull request or a comment on one.

Start a job from whatever you were given. A description of new work goes straight to a job. An issue number starts a job for that issue. With nothing given, take the oldest open issue that no open pull request closes yet, and if there is none, say the backlog is empty and stop. Work each job in its own git worktree off the latest main branch, so several jobs can run at once without touching each other.

Run each stage below as a separate agent, briefed with its file from the `roles` folder next to this skill and with the job's context, and run them yourself one after another if your harness has no subagents. Use your strongest model for the spec and the approval, since those decide what gets built and what ships. Your own job is to pass work between the stages and keep GitHub up to date, not to do the work for them.

First have the spec writer turn the request or the issue into a spec. Then have the builder implement it on a new branch, following the branch and commit skills, and open a draft pull request following the pull-request skill, closing the issue if there is one. Post the spec as the first comment on the pull request, so everyone after the builder reads the same thing.

Next run the reviewers in parallel, one per lens that the change actually touches: security, UX, UI design and code. Post their findings together as one comment on the pull request for each round. If any reviewer asks for changes, hand that comment to the builder, push the fixes, and review again. Stop after two rounds of rework, even if findings remain.

Finally have the approver decide, and mark the pull request ready either way. If it says merge, merge it following the merge skill. If it escalates, leave the pull request open and post its comment saying exactly what a human needs to look at. When in doubt, the approver escalates.

Finish by reporting each job in one line: the pull request link and whether it merged or is waiting on a human. Never close issues by hand or merge anything the approver escalated.
