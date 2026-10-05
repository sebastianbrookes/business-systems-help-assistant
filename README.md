# Gapfinder: AI Help Assistant for Business Systems

A live demo helpdesk for Northwake Therapeutics, a fictional biotech. Employees ask how to get things done in its business systems. The assistant answers only from Help articles and names the article it used. When the articles fall short, it logs a Gap, groups it with similar questions, and lets the IT team have the AI draft the missing article. A person fills in any facts the AI couldn't source and approves it.

- **Live demo:** [help.sebastianbrookes.com](https://help.sebastianbrookes.com)
- **Case study:** [sebastianbrookes.com/projects/help-assistant](https://sebastianbrookes.com/projects/help-assistant)
- **Test set results:** [results/summary.md](results/summary.md)

The company, its data, and the Test set are fake. I built this with Claude Code. I made the design decisions and checked the result, and the AI wrote the code. The case study's How I built it section says who did what.

## How it's built

- **Vite + React** on Vercel serves the page. It holds no secrets and makes no AI calls.
- **Convex** holds the data, the limits, the OpenRouter key, and every AI call. Each Visitor gets a random ID in their browser and sees the starting data plus only their own activity.
- **OpenRouter** runs the model, named once in `convex/openrouter.ts`. Prepaid credit, a monthly key limit, and daily call limits per Visitor and for the whole app cap spending.

## Layout

- `src/`: the React app
- `convex/`: the backend functions, schema, starting data, and tests
- `scripts/`: one-off scripts. `generateHistory.ts` made the starting question history, and `runTestSet.ts` runs the Test set.
- `results/`: the Test set results files and summary
- `.scratch/help-assistant/`: the build spec and its tickets
- `GLOSSARY.md`: the project's vocabulary

## Running it locally

You need a Convex account and an OpenRouter key.

```sh
pnpm install
pnpm exec convex dev --once --configure new   # writes .env.local
pnpm exec convex env set OPENROUTER_API_KEY <your key>
pnpm exec convex run seed:load
```

Then run `pnpm dev:convex` and `pnpm dev` in two terminals, and open http://localhost:5173.

## Tests

```sh
pnpm typecheck
pnpm test
```

The tests run the Convex functions with `convex-test` and a stubbed `fetch`, so they make no AI calls.
