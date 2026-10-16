---
name: merge
description: Use whenever merging a pull request or suggesting how to merge one.
---

Merge pull requests into the main branch with a squash merge, so each one lands as exactly one commit and history stays linear. Don't use merge commits or rebase merges, and don't merge while checks are failing or review threads are still open. If the branch has fallen behind the main branch, bring it up to date first and wait for checks to pass on the result.

Write the squash commit the same way as any other commit, following the commit skill, and end its subject with the pull request number, such as `feat: add a delete command for todos (#6)`. Keep the body to the short why, not a list of the branch's commits. If the pull request closes issues, put them on a single line such as `Closes #12, closes #14`, directly above the `Co-Authored-By` trailer with no blank line in between.

After merging, delete the branch.
