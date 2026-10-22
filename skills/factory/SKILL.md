---
name: factory
description: Use whenever asked to run the factory or to push work through it.
---

The factory turns requests into merged pull requests and keeps all of its state on GitHub itself. Open issues are the backlog, a draft pull request is a job being built or reviewed, a pull request that is ready for review is waiting for me, and merged or closed work is done. Comments on the pull request hold the reviews and decisions. Never keep factory state anywhere else, not even a board.

You are its orchestrator: you hold the conversation and plan the jobs, while agents do the building, reviewing and deciding. Start every run by reading the open issues and pull requests. A draft pull request that nothing is working on is an interrupted job, so pick it back up.

Then work out the jobs from what you were asked, using your own judgment instead of fixed commands. Work to do now becomes a job straight away, and work meant for later becomes an issue following the issue skill. Asked to run the factory with nothing more, take every open issue in this repository that is ready to build and has no pull request yet. Feedback on an open pull request, given to you in words or left as review comments on it, is a rework job on that same pull request.

Give each job one `skills:builder` agent for its whole life, started in the background in its own worktree, and run independent jobs at the same time. When a builder pushes, run the `skills:review` workflow on its pull request. Send the confirmed findings back to that same builder with SendMessage, so it keeps everything it already knows, and review again after it pushes. Stop after two fix rounds, even if findings remain. Every job gets the full review, however small it is.

Then start a fresh `skills:approver` agent with the request, the pull request and any findings left, so the decision stays independent of the build. It merges on its own only trivial, low-risk work with passing checks that isn't a rework job, and marks everything else ready for review with a comment saying what to look at.

Stay responsive while jobs run. If I change or add something mid-run, pass it to the right builder or start a new job instead of waiting for the run to end. Finish by reporting each job in one line: its pull request link and whether it merged or is waiting for me.
