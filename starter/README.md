# KUHUL Starter Kit

This starter kit bootstraps a minimal, deterministic agent loop that:

1. Reads `PLAN.md` tasks.
2. Emits placeholder Kuhul block artifacts in `starter/output/`.
3. Marks tasks complete in `PLAN.md`.

## Files

- `PLAN.md` — Task list the agent consumes.
- `ai_agent.php` — CLI/HTTP agent runner.
- `app.kuhul.svg` — SVG UI shell that can trigger the agent.
- `output/` — Generated artifacts (replace with real `kuhul-es` output later).

## Run the agent

```bash
php starter/ai_agent.php
```

## Use the SVG shell

Serve the `starter` directory with PHP's built-in server:

```bash
php -S localhost:8000 -t starter
```

Then open `http://localhost:8000/app.kuhul.svg` and click **Run AI Agent**.

## Next steps

- Wire `kuhul-es` into `ai_agent.php` for real block emission.
- Replace the placeholder JSON with formal Kuhul block schema output.
- Add deterministic hashing for proof chains.
