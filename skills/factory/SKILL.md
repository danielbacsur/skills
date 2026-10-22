---
name: factory
description: Use whenever asked to run the factory or to push work through it.
---

The factory turns requests into merged pull requests and keeps all of its state on GitHub. Open issues are the backlog, a pull request is a job in progress, and comments on it hold the reviews and decisions. The only view is the GitHub project titled `Factory` under your account, whose Status field has exactly the options Todo, In progress, In review, Waiting and Done. Never keep factory state anywhere else.

Start every run by syncing the board. If the project doesn't exist yet, create it and set up its Status options. Then make every card match GitHub: merged or closed work goes to Done, an open pull request that is ready for review goes to Waiting, and an open issue with no pull request goes to Todo. Each job has exactly one card, its issue if it has one and otherwise its pull request. A draft pull request that no run is working on is an interrupted job, so pick it back up.

Then work out the jobs from what you were asked, using your own judgment instead of fixed commands. Work to do now becomes a job straight away, and work meant for later becomes an issue following the issue skill, with its card in Todo. Asked to run the factory with nothing more, take every Todo issue in this repository that is ready to build. Feedback on an open pull request, given to you in words or left as review comments on it, is a rework job on that same pull request.

Run all the jobs at once with the `skills:factory-run` workflow, passing `{ board: { owner, number }, jobs: [{ repository, issue?, pullRequest?, request }] }` as its args, and don't do its stages yourself. For each job it has the builder implement the work on its own branch and draft pull request, runs the code review and security review, has a separate agent try to refute every finding, and sends the real ones back to the builder for up to two rounds. Every job gets the full review, however small it is.

The approver then decides. It merges on its own only when the change is trivial and low risk, such as a dependency bump or a color change, its checks pass, no findings are left, and it isn't a rework job. Everything else is marked ready, gets a comment saying what to look at, and waits in Waiting for you to merge it.

Finish by reporting each job in one line: its pull request link and the column its card ended in.
