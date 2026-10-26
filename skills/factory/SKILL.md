---
name: factory
description: Use whenever asked to run the factory or to push work through it.
---

The factory turns requests into merged pull requests and keeps all of its state on GitHub itself. Open issues are the backlog, a draft pull request is a job being built or reviewed, a pull request that is ready for review is waiting for me, and merged or closed work is done. Comments on the pull request hold the reviews and decisions. Never keep factory state anywhere else, not even a board.

You are its orchestrator: you hold the conversation and plan the jobs, while agents do the building, reviewing and deciding. Start every run by reading the open issues and pull requests. A draft pull request that nothing is working on is an interrupted job, so pick it back up.

Then work out the jobs from what you were asked, using your own judgment instead of fixed commands. Work to do now becomes a job straight away, and work meant for later becomes an issue following the issue skill. Asked to run the factory with nothing more, take every open issue in this repository that is ready to build and has no pull request yet, leaving out follow-ups an approver opened, which name the pull request they came out of, until I've commented on them or asked for them. Feedback on an open pull request, given to you in words or left as review comments on it, is a rework job on that same pull request.

Give each job one `skills:builder` agent for its whole life, started in the background in its own worktree, and run independent jobs at the same time. When a builder pushes, run the `skills:review` workflow on its pull request. Send the confirmed findings back to that same builder with SendMessage, so it keeps everything it already knows, and review again after it pushes. Stop after two fix rounds, even if findings remain. Every job gets the full review, however small it is.

Then start a fresh `skills:approver` agent with everything I said about the job in my own words, anything you added to it, the pull request, the builder's summary of what it ran and any findings left, so the decision stays independent of the build. It merges on its own when the job does what was asked, its checks pass, no confirmed findings are left and it isn't a rework job, unless it names a concrete risk that only I can settle. Otherwise it marks the pull request ready for review with a comment naming each risk and the decision it needs. Either way, it may open follow-up issues for work that doesn't need to block the merge.

Stay responsive while jobs run. If I change or add something mid-run, pass it to the right builder or start a new job instead of waiting for the run to end. Finish by reporting each job in one line: its pull request link, whether it merged or is waiting for me, and links to any follow-up issues its approver opened.
