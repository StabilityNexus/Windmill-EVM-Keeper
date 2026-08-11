<!-- Don't delete it -->
<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="public/stability.svg" width="175">
</div>

&nbsp;

<!-- Organization Name -->
<div align="center">

[![Static Badge](https://img.shields.io/badge/Stability_Nexus-Windmill_EVM_Keeper-228B22?style=for-the-badge&labelColor=FFC517)](https://stability.nexus/)

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
&nbsp;&nbsp;
<!-- Medium -->
<a href="https://news.stability.nexus/">
  <img src="https://img.shields.io/badge/Medium-black?style=flat&logo=medium&logoColor=black&logoSize=auto&color=white" alt="Medium Badge"></a>
&nbsp;&nbsp;
<!-- LinkedIn -->
<a href="https://linkedin.com/company/stability-nexus">
  <img src="https://img.shields.io/badge/LinkedIn-black?style=flat&logo=LinkedIn&logoColor=white&logoSize=auto&color=0A66C2" alt="LinkedIn Badge"></a>
&nbsp;&nbsp;
<!-- Youtube -->
<a href="https://www.youtube.com/@StabilityNexus">
  <img src="https://img.shields.io/youtube/channel/subscribers/UCZOG4YhFQdlGaLugr_e5BKw?style=flat&logo=youtube&logoColor=white&logoSize=auto&labelColor=FF0000&color=FF0000" alt="Youtube Badge"></a>
</p>

---

<div align="center">
<h1>Windmill EVM Keeper</h1>
</div>

Windmill EVM Keeper is a Node.js bot for building EVM keeper bots that monitor protocol state and execute automated maintenance transactions safely. It is specifically configured for the Windmill Exchange matching algorithm.

---

## 🚀 Features

- **Automated Matching**: Continuously monitors the Windmill Exchange for matchable orders and executes them.
- **O(N log N) Two-Pointer Sweep**: Efficiently matches overlapping orderbooks to minimize gas usage and maximize matches.
- **Dry-Run & Safety Controls**: Simulate transactions locally before broadcasting to save gas and avoid reverts.

---

## Architecture

```text
Windmill-EVM-Keeper2/
├── src/
│   ├── index.js             # Main entry point
│   ├── keeper-runner.js     # Keeper loop logic
│   ├── config.js            # Configuration loader
│   ├── logger.js            # Structured logging
│   └── strategies/          # Execution strategies (Windmill strategy)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Environment | Node.js (v20+) |
| Web3 Library | ethers.js (v6) |
| Container | Docker (node:20-alpine) |

---

## Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| `git` | any | [git-scm.com](https://git-scm.com/) |
| `node` | 20+ | [nodejs.org](https://nodejs.org/) |
| `npm` | 10+ | (comes with node) |

### Installation

```bash
git clone https://github.com/StabilityNexus/Windmill-EVM-Contracts.git
cd Windmill-EVM-Contracts/Windmill-EVM-Keeper2
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and configure your node:

```env
KEEPER_STRATEGY=windmill
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
EXPECTED_CHAIN_ID=11155111
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
KEEPER_INTERVAL_MS=15000
DRY_RUN=false
```

---

## Usage

### Run Locally

```bash
# Test with dry run first (no transactions)
npm run start:dry-run

# Single cycle test
npm run start:once

# Production continuous loop
npm run start
```

### Run with Docker

```bash
# Build the image
docker build -t windmill-evm-keeper .

# Run the container
docker run -d \
  --env-file .env \
  --name keeper \
  windmill-evm-keeper
```

---

## 🙌 Contributing

⭐ Don't forget to star this repository if you find it useful! ⭐

Thank you for considering contributing to this project! Contributions are highly appreciated and welcomed. To ensure smooth collaboration, please refer to our [Contribution Guidelines](./CONTRIBUTING.md).

---

## 📍 License

See the [LICENSE](LICENSE) file for details.

---

## 💪 Thanks To All Contributors

Thanks a lot for spending your time helping Windmill EVM Keeper grow. Keep rocking!

[![Contributors](https://contrib.rocks/image?repo=StabilityNexus/Windmill-EVM-Contracts)](https://github.com/StabilityNexus/Windmill-EVM-Contracts/graphs/contributors)

© 2026 Stability Nexus
