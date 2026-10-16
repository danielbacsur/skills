---
name: pull-request
description: Use whenever opening a pull request, editing its title or description, or suggesting one.
---

Give the pull request a plain, human-readable title that says what it does, in sentence case with no conventional commit prefix, scope or trailing period. Keep it between 50 and 70 characters, aiming for about 60 and never going past 80. If it doesn't fit, rephrase it instead of padding it out or cutting meaning.

Write the description as three plain paragraphs, in this order: why the change was needed, what changed, and how you verified it. Give each paragraph three to four sentences, about 300 characters, staying between 200 and 400. Don't add headings, bullet lists or checklists, and don't walk through the diff line by line. If you couldn't verify something, say so plainly.

Open it against the main branch, never against another pull request's branch. If it finishes issues, end the description with a blank line and a single line closing them all, such as `Closes #12, closes #14`. Don't add a generated-by line yourself, and leave out everything else: no labels, assignees, reviewers, milestones, or markers and tags tied to a specific tool or harness.
