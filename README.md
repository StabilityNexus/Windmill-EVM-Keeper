<!-- Don't delete it -->
<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Windmill" src="public/windmill-logo.svg" width="120">
  <img alt="Stability Nexus" src="public/stability.svg" width="175">
</div>

&nbsp;

<div align="center">

[![Static Badge](https://img.shields.io/badge/Stability_Nexus-Windmill_Keeper-228B22?style=for-the-badge&labelColor=FFC517)](https://github.com/StabilityNexus/Windmill-EVM-Keeper)

</div>

<!-- Organization/Project Social Handles -->
<p align="center">
<!-- Telegram -->
<a href="https://t.me/StabilityNexus">
<img src="https://img.shields.io/badge/Telegram-black?style=flat&logo=telegram&logoColor=white&logoSize=auto&color=24A1DE" alt="Telegram Badge"/></a>
&nbsp;&nbsp;
<!-- X (formerly Twitter) -->
<a href="https://x.com/StabilityNexus">
<img src="https://img.shields.io/twitter/follow/StabilityNexus" alt="X (formerly Twitter) Badge"/></a>
&nbsp;&nbsp;
<!-- Discord -->
<a href="https://discord.gg/YzDKeEfWtS">
<img src="https://img.shields.io/discord/995968619034984528?style=flat&logo=discord&logoColor=white&logoSize=auto&label=Discord&labelColor=5865F2&color=57F287" alt="Discord Badge"/></a>
</p>

---

<div align="center">
<h1>Windmill EVM Keeper</h1>
</div>

**Windmill EVM Keeper** is the off-chain automation layer for **Windmill Exchange** — a decentralized on-chain order matching engine. Keeper bots monitor protocol state and execute the automated maintenance and settlement transactions that keep matches flowing, safely and continuously.

Built as a strategy-based Node.js keeper: protocol-specific logic lives in isolated strategy modules, while a hardened runtime handles the production loop (guards, confirmations, error handling, structured logs).

---

## Features

- **Strategy-based keeper core**: protocol logic isolated in `src/strategies/`.
- **Safe execution controls**: `DRY_RUN`, `MAX_ACTIONS_PER_CYCLE`, `EXPECTED_CHAIN_ID`, and confirmation controls.
- **Production-friendly runtime**: graceful loop execution, robust error handling, and structured logs.
- **CI-ready**: unit tests, CI workflow, security audit workflow, and release artifact workflow included.

---

## 🔗 Repository Links

1. [Main Repository](https://github.com/StabilityNexus/Windmill-EVM-Keeper)
2. [Smart Contracts](https://github.com/StabilityNexus/Windmill-EVM-Contracts)
3. [Web UI](https://github.com/StabilityNexus/Windmill-EVM-WebUI)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | JavaScript (ESM) |
| Blockchain | EVM-compatible networks, Ethers.js v6, JSON-RPC providers |
| Config | dotenv |

---

## Project Checklist

- [x] **Protocol monitoring** — strategies scan on-chain state for actionable work items.
- [x] **Safe execution** — dry-run mode, action caps, chain-id validation.
- [x] **Automated maintenance** — executes keeper transactions and waits for confirmations.
- [x] **CI + security workflows** — tests, lint, release artifacts.

---

## User Flow

```text
Start keeper -> Load config -> Validate chain -> Detect actionable items ->
(optional dry-run) -> Execute tx actions -> Wait confirmations -> Repeat
```

### Key User Journeys

1. **Setup**
   - Copy `.env.example` to `.env`
   - Choose a strategy
   - Configure RPC and contract values

2. **Local Validation**
   - Run `npm test`
   - Run `npm run start:once`
   - Run `npm run start:dry-run`

3. **Production Loop**
   - Run `npm run start`
   - Monitor logs and tx outcomes
   - Tune cycle interval and action cap

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- EVM RPC endpoint
- Funded keeper wallet private key (for write strategies)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/StabilityNexus/Windmill-EVM-Keeper.git
cd Windmill-EVM-Keeper
```

#### 2. Install Dependencies

```bash
npm ci
```

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
KEEPER_STRATEGY=noop
RPC_URL=
EXPECTED_CHAIN_ID=
PRIVATE_KEY=
CONTRACT_ADDRESS=
TX_CONFIRMATIONS=1
MAX_ACTIONS_PER_CYCLE=25
KEEPER_INTERVAL_MS=15000
DRY_RUN=false
LOG_LEVEL=info
```

Free public RPC options for `RPC_URL`:

- Base Mainnet (`8453`): `https://mainnet.base.org`
- Base Sepolia (`84532`): `https://sepolia.base.org`
- BNB Smart Chain Mainnet (`56`): `https://bsc-dataseed.bnbchain.org`
- BNB Smart Chain Testnet (`97`): `https://bsc-testnet-dataseed.bnbchain.org`
- Polygon PoS Mainnet (`137`): `https://polygon-bor-rpc.publicnode.com`
- Polygon Amoy (`80002`): `https://polygon-amoy-bor-rpc.publicnode.com`

#### 4. Run the Keeper

```bash
# one cycle
npm run start:once

# continuous loop
npm run start

# no transactions, log-only
npm run start:dry-run
```

#### 5. Test

```bash
npm test
```

#### 6. Verify Execution

Check terminal logs for:

- network and signer initialization
- detected work items
- executed transactions (or dry-run actions)

---

## Repository Structure

```text
.
├── src/
│   ├── index.js          # Entry point / CLI args
│   ├── keeper-runner.js  # Keeper runtime loop
│   ├── logger.js         # Structured logging
│   ├── config.js         # Env-based configuration
│   └── strategies/       # Protocol-specific strategy modules
├── test/                 # Unit tests (node --test)
├── public/               # Logos and static assets
├── CONTRIBUTING.md       # Contribution guidelines
└── README.md
```

---

## Contributing

⭐ Don't forget to star this repository if you find it useful. ⭐

Thank you for considering contributing to this project! Please read our [Contribution Guidelines](./CONTRIBUTING.md) — they cover the mandatory Discord workflow and our AI-use disclosure policy.

---

## License

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for details.

---

## 💪 Thanks To All Contributors

[![Contributors](https://contrib.rocks/image?repo=StabilityNexus/Windmill-EVM-Keeper)](https://github.com/StabilityNexus/Windmill-EVM-Keeper/graphs/contributors)

© Stability Nexus