<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="Stability Nexus" src="public/stability.svg" width="175">
</div>

&nbsp;

<div align="center">
<h1>Windmill EVM Keeper Bot</h1>
<p><em>Autonomous order matching daemon for the Windmill dynamic pricing exchange protocol.</em></p>
</div>

**Windmill EVM Keeper** is an automated Node.js keeper bot for the **Windmill Exchange** limit order protocol. It continuously monitors active orders on-chain, tracks Dutch-auction price curves in real-time, identifies matching buy/sell order pairs across liquidity pools, and executes on-chain matching transactions (`matchOrders`).

---

## ⚡ Features

- **Windmill Dutch-Auction Matching**: Scans orders, updates prices dynamically according to linear slope decay formulas, and pairs matching buyer and seller orders.
- **Dynamic Pair Discovery**: Automatically discovers active token pairs by scanning `OrderCreated` events starting from `DEPLOY_BLOCK`.
- **Automated PowerShell Runner (`run_keeper.ps1`)**: One-click setup script that verifies environment variables, installs missing dependencies, and starts the keeper loop.
- **Execution & Safety Controls**: Built-in support for `DRY_RUN`, `MAX_ACTIONS_PER_CYCLE`, `EXPECTED_CHAIN_ID`, and gas/confirmation settings.
- **Production Runtime**: Graceful lifecycle management (`SIGINT`/`SIGTERM`), error retry limits, health checks, and structured JSON logs.

---

## 🛠️ Tech Stack & Requirements

- **Runtime**: Node.js (>=20.0.0)
- **Library**: Ethers.js v6
- **Smart Contract Target**: WindmillExchange (`0x96dce657ba9bd3db2533bbee0b2e2dbf334232d2` on Sepolia)
- **Language**: JavaScript (ESM)

---

## 🏗️ Architecture & Matching Loop

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

## 🚀 Quick Start & Environment Configuration

### Environment Variables (`.env`)

Copy `.env.example` to `.env` in the root of `Windmill-EVM-Keeper2`:

```env
KEEPER_STRATEGY=windmill
EXPECTED_CHAIN_ID=11155111
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
CONTRACT_ADDRESS=0x96dce657ba9bd3db2533bbee0b2e2dbf334232d2
TX_CONFIRMATIONS=1
MAX_ACTIONS_PER_CYCLE=25
KEEPER_INTERVAL_MS=15000
DRY_RUN=false
LOG_LEVEL=info
DEPLOY_BLOCK=11466622
```

---

## 💻 Local Execution & Testing

### Option 1: Direct Node.js Command
```bash
npm start
```

### Option 2: Automated PowerShell Script (`run_keeper.ps1`)
```powershell
.\run_keeper.ps1
```

### Option 3: Simulation / Dry-Run Mode
```bash
npm run start:dry-run
```

### Option 4: Single Scan Cycle
```bash
npm run start:once
```

### Option 5: Running Unit Tests
```bash
npm test
```

---

## 🌐 Self-Hosting & Deployment Documentation

### 1. Systemd Service Deployment (Ubuntu / Debian VPS)

To host the keeper bot on a Linux VPS (e.g. Hetzner, DigitalOcean, Linode, AWS EC2):

1. **Install Node.js 20+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```

2. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/StabilityNexus/Windmill-EVM-Keeper.git /opt/windmill-keeper
   cd /opt/windmill-keeper
   npm install --production
   cp .env.example .env
   # Edit .env with your RPC_URL and PRIVATE_KEY
   ```

3. **Create Systemd Unit (`/etc/systemd/system/windmill-keeper.service`)**:
   ```ini
   [Unit]
   Description=Windmill EVM Keeper Bot
   After=network.target

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/windmill-keeper
   ExecStart=/usr/bin/node src/index.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

4. **Enable & Start Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable windmill-keeper
   sudo systemctl start windmill-keeper
   sudo systemctl status windmill-keeper
   ```

---

### 2. PM2 Process Manager Deployment

Alternatively, use PM2 for automatic process monitoring and log rotation:

```bash
npm install -g pm2
pm2 start src/index.js --name "windmill-keeper"
pm2 save
pm2 startup
```

---

### 3. Docker & Container Deployment

To run in isolated Docker containers:

#### `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "src/index.js"]
```

#### Build & Run Container:
```bash
docker build -t windmill-keeper .
docker run -d --name windmill-keeper --env-file .env --restart unless-stopped windmill-keeper
```

---

### 4. Dynamic IP & Cloud DNS Configuration

For self-hosted keepers running on residential or dynamic IP servers (e.g., home server, Raspberry Pi):

- **DDNS (Dynamic DNS)**: Use DDNS services like `ddclient`, Cloudflare DDNS, or No-IP to sync dynamic server IP addresses with your DNS hostname.
- **RPC Failover**: Configure multi-RPC fallbacks in `.env` to ensure continuous connection resilience if public RPC nodes rate-limit your keeper IP.

---

## 📄 License

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for details.

© 2026 Stability Nexus & AOSSIE
