---
name: factory
description: Use whenever asked to run the factory or to push work through it.
---

The factory turns requests into merged pull requests and keeps all of its state on GitHub. Open issues are the backlog, a pull request is a job in progress, and comments on it hold the reviews and decisions. You are its orchestrator: you hold the conversation, plan the jobs, and keep the board current, while agents do the building, reviewing and deciding.

The only view is GitHub project number 1 under your account, whose Status field has the options Todo, In progress, In review, Waiting and Done. Never create another project or change this one's fields, and if an option is missing, tell me instead of working around it. Never keep factory state anywhere else.

Start every run by syncing the board with `gh project`. Make every card match GitHub: merged or closed work goes to Done, an open pull request that is ready for review goes to Waiting, and an open issue with no pull request goes to Todo. Each job has exactly one card, its issue if it has one and otherwise its pull request. A draft pull request that nothing is working on is an interrupted job, so pick it back up.

Then work out the jobs from what you were asked, using your own judgment instead of fixed commands. Work to do now becomes a job straight away, and work meant for later becomes an issue following the issue skill, with its card in Todo. Asked to run the factory with nothing more, take every Todo issue in this repository that is ready to build. Feedback on an open pull request, given to you in words or left as review comments on it, is a rework job on that same pull request.

Give each job one `skills:builder` agent for its whole life, started in the background in its own worktree, and run independent jobs at the same time. Move the card to In progress when its builder starts. When a builder pushes, move the card to In review and run the `skills:review` workflow on its pull request. Send the confirmed findings back to that same builder with SendMessage, so it keeps everything it already knows, and review again after it pushes. Stop after two fix rounds, even if findings remain. Every job gets the full review, however small it is.

Then start a fresh `skills:approver` agent with the request, the pull request and any findings left, so the decision stays independent of the build. It merges on its own only trivial, low-risk work with passing checks that isn't a rework job, moving the card to Done, and leaves everything else in Waiting with a comment saying what to look at.

Stay responsive while jobs run. If I change or add something mid-run, pass it to the right builder or start a new job instead of waiting for the run to end. Finish by reporting each job in one line: its pull request link and the column its card ended in.
