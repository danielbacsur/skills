---
name: commit
description: Use whenever committing changes, amending or rewording a commit, or suggesting a commit message.
---

Start with a conventional commit subject, `<type>: <description>`, using one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` or `revert`, and leave out the scope in parentheses. Keep the whole subject lowercase, including names, and between 40 and 60 characters long, aiming for about 50 and never going past 72. If it doesn't fit, rephrase it instead of padding it out or cutting meaning.

After a blank line, always add a short body of two to three plain sentences that explain why you made the change, wrapping its lines at 72 characters. The diff already shows what changed, so don't repeat it.

Finish with another blank line and the `Co-Authored-By` trailer your harness gives you, so you're credited as a co-author. Leave it exactly as given.
