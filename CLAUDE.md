@AGENTS.md

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Draw the Vote — project rules

- `preview/draw-the-vote-preview.html` is the finished design, animation and game
  loop. Port it; do not redesign it.
- `app/globals.css` holds every design token. Do NOT add Tailwind and do NOT
  replace these values with utility classes.
- The tricolour is load-bearing: saffron = a misread symbol, green = a correct
  one, navy = the system's voice. Never decorative.
- Canvas ink stays dark (#14120C) in all three themes — you always draw on
  white paper.
- `lib/`, `convex/` and `app/api/` are already written. Wire the UI to them.
  Do not rewrite them.
- One feature per change. Commit after each working step.
