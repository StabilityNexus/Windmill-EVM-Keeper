<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="public/stability.svg" width="175">
</div>

&nbsp;

<div align="center">
<h1>Windmill EVM Keeper</h1>
</div>

**Windmill EVM Keeper** is an automated Node.js keeper bot for the **Windmill Exchange** limit order protocol. It continuously monitors active orders on-chain, tracks Dutch-auction price curves in real-time, identifies matching buy/sell order pairs across liquidity pools, and executes on-chain matching transactions (`matchOrders`).

---

## Features

- **Windmill Dutch-Auction Matching**: Scans orders, updates prices dynamically, and pairs matching buyer and seller orders.
- **Dynamic Pair Discovery**: Automatically discovers active token pairs by scanning `OrderCreated` events starting from `DEPLOY_BLOCK`.
- **Automated PowerShell Runner (`run_keeper.ps1`)**: One-click setup script that verifies environment variables, installs missing dependencies, and starts the keeper loop.
- **Execution & Safety Controls**: Built-in support for `DRY_RUN`, `MAX_ACTIONS_PER_CYCLE`, `EXPECTED_CHAIN_ID`, and gas/confirmation settings.
- **Production Runtime**: Graceful lifecycle management (`SIGINT`/`SIGTERM`), error retry limits, and structured JSON logs.

---

## Tech Stack

- **Runtime**: Node.js (>=20)
- **Library**: Ethers.js v6
- **Smart Contract Target**: WindmillExchange (`0x96dce657ba9bd3db2533bbee0b2e2dbf334232d2` on Sepolia)
- **Language**: JavaScript (ESM)

---

## Architecture

```text
+-------------------------+
|     Keeper Runner       |
| (Continuous Loop/Interval|
+------------+------------+
             |
             v
+-------------------------+        +------------------------------+
| Windmill Strategy Core  | -----> |   WindmillExchange Contract  |
| (Order Discovery/Match) |        | (getOrdersByPair/matchOrders)|
+------------+------------+        +--------------+---------------+
             |                                    |
             v                                    v
+-------------------------+        +------------------------------+
|   Ethers Provider/Wallet| <----> |        Ethereum Network      |
+-------------------------+        +------------------------------+
```

---

## Is Docker Required?

**No, Docker is NOT required.**

The keeper is a lightweight native Node.js application. You can run it directly on Windows, Linux, or macOS with standard Node.js (v20+). Docker can optionally be used if container deployment is desired (e.g. AWS ECS/Kubernetes), but it is completely optional.

---

## Quick Start & Commands

### Prerequisites
- Node.js (v20+) installed on your machine
- Funded EVM Wallet (Sepolia ETH for gas when broadcasting matches)

### Environment Setup (`.env`)
Create or edit `.env` in the keeper directory:

```env
KEEPER_STRATEGY=windmill
EXPECTED_CHAIN_ID=11155111
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=0x... (Your Keeper Private Key)
CONTRACT_ADDRESS=0x96dce657ba9bd3db2533bbee0b2e2dbf334232d2
TX_CONFIRMATIONS=1
MAX_ACTIONS_PER_CYCLE=25
KEEPER_INTERVAL_MS=15000
DRY_RUN=false
LOG_LEVEL=info
DEPLOY_BLOCK=11466622
```

---

### Command Guide (PowerShell & CMD)

#### 📍 Step 1: Navigate to the Directory

- **PowerShell**:
  ```powershell
  cd c:\Users\Hp\Windmill-EVM-Contracts\Windmill-EVM-Keeper2
  ```
- **Command Prompt (CMD)**:
  ```cmd
  cd /d c:\Users\Hp\Windmill-EVM-Contracts\Windmill-EVM-Keeper2
  ```

---

#### 🚀 Command 1: Continuous Production Loop (Standard Run)
> **When to run:** When you want the keeper bot to run indefinitely, scanning the order book every 15 seconds and automatically submitting on-chain matching transactions.

- **PowerShell**:
  ```powershell
  node src/index.js
  ```
- **Command Prompt (CMD)**:
  ```cmd
  node src/index.js
  ```

---

#### ⚡ Command 2: Automated Helper Script (`run_keeper.ps1`)
> **When to run:** On initial setup, after a fresh clone, or when you want an automated script to verify your `.env` configuration, auto-install missing `node_modules`, and launch the keeper.

- **PowerShell**:
  ```powershell
  .\run_keeper.ps1
  ```
- **Command Prompt (CMD)**:
  ```cmd
  powershell -ExecutionPolicy Bypass -File .\run_keeper.ps1
  ```

---

#### 🧪 Command 3: Simulation / Dry-Run Mode
> **When to run:** When testing your setup, verifying RPC connections, or inspecting matching order pairs without spending Sepolia ETH gas or broadcasting live on-chain transactions.

- **PowerShell**:
  ```powershell
  node src/index.js --dry-run
  ```
- **Command Prompt (CMD)**:
  ```cmd
  node src/index.js --dry-run
  ```

---

#### ⏱️ Command 4: Single-Cycle Execution (`--once`)
> **When to run:** When executing a single scan-and-match cycle (ideal for cron jobs, scheduled tasks, or quick sanity checks) and immediately exiting after completion.

- **PowerShell**:
  ```powershell
  node src/index.js --once
  ```
- **Command Prompt (CMD)**:
  ```cmd
  node src/index.js --once
  ```

---

#### 🧪 Command 5: Run Unit Test Suite
> **When to run:** Before deploying code changes or after updating strategy logic to verify that all 10 unit tests pass.

- **PowerShell**:
  ```powershell
  cmd /c npm test
  ```
- **Command Prompt (CMD)**:
  ```cmd
  npm test
  ```

---

## License

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for details.

© 2026 Stability Nexus


