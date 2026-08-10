# AGENTS.md

Guidance for AI coding agents working in the **Windmill-EVM-Keeper** repository.

## Project overview

Off-chain keeper bots for Windmill Exchange. The keeper runtime monitors protocol state (via Ethers.js v6 providers) and executes maintenance/settlement transactions against the Windmill smart contracts. Keep the runtime protocol-agnostic; protocol logic lives in strategies.

## Repository layout

- `src/index.js` — entry point; parses `--once`, `--dry-run` CLI args.
- `src/keeper-runner.js` — the keeper loop (validate chain, find work items, execute, confirm).
- `src/config.js` — env-based configuration (`KEEPER_STRATEGY`, `RPC_URL`, `EXPECTED_CHAIN_ID`, `DRY_RUN`, etc.).
- `src/logger.js` — structured logging.
- `src/strategies/` — protocol-specific strategy modules implementing work-item detection + execution.
- `test/` — unit tests using `node --test`.

## Development workflow

```bash
npm ci              # install deps
npm test            # run tests
npm run start:once       # single cycle
npm run start:dry-run    # log-only cycle (no txs)
npm run start             # continuous loop
```

CI runs tests on every PR; keep tests green before finishing.

## Conventions

- Node.js 20+, ESM, plain JavaScript.
- Prefer `const` over `let`; never `var`. Use arrow functions where appropriate.
- Strategy functions must be deterministic and fail with clear error messages.
- Do not log private keys, raw signer secrets, or sensitive config. Use `.env` (never commit `.env`; only `.env.example`).
- Keep the core runner in `src/` generic; add new protocol behavior under `src/strategies/`.
- Remove `console.log` noise before committing; prefer `logger.js`.

## Safety

- Respect guards: `DRY_RUN`, `MAX_ACTIONS_PER_CYCLE`, `EXPECTED_CHAIN_ID`, `TX_CONFIRMATIONS`.
- Never hard-code a funded deployment key. Use `PRIVATE_KEY` from `.env`.

## Communication

All project communication happens on Discord (`#windmill-exchange`). GitHub is for code only. Mention AI usage in PR descriptions when applicable.