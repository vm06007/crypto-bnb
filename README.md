# PayperPlane - Universal Crypto Payment Solution

PayperPlane is a browser extension that enables crypto payments on ANY website that accepts card payments, even if the merchant doesn't support cryptocurrency.

## 🚀 What It Does

- **Replaces card input** - No more typing card numbers, expiry dates, or CVV
- **One-click crypto payments** - Simply send crypto through the plugin
- **Privacy first** - No financial data shared with merchants
- **Works everywhere** - No merchant integration required

## 🔄 How It Works

1. **Detects payment forms** on any website
2. **Injects wallet connector** for crypto payments
3. **Processes crypto payment** and generates virtual card in parallel
4. **Completes payment** without card input needed

**The Magic**: Any website with payment forms becomes crypto-compatible instantly!

## 🏗️ Architecture

```
Browser Extension ←→ Smart Contract ←→ Backend API ←→ Lithic API
     ↓                    ↓                ↓              ↓
Detects Forms      Handles Funding   Processes Events  Generates Cards
Injects UI         Stores Events     Monitors Chain    Virtual Cards
Wallet Connect     Admin Controls    Crypto Conversion Payment Processing
```

## 📁 Project Structure

```
crypto-bnb/
├── extension/          # Browser extension (Chrome/Edge/Brave)
├── evm/               # Smart contracts (Solidity)
├── backend/           # Backend API (Python/FastAPI)
├── payperplane-react/ # Landing page (React/Vite)
└── shared/            # Shared TypeScript types
```

## 🛠️ Tech Stack

- **Frontend**: TypeScript, Chrome Extension Manifest V3, WAGMi, React, Vite
- **Smart Contracts**: Solidity 0.8+, Foundry, OpenZeppelin, Solady
- **Backend**: FastAPI (Python), UV package manager
- **Package Manager**: Bun

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Bun
- Foundry (for smart contracts)
- Python 3.9+ and UV (for backend)
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/crypto-bnb.git
   cd crypto-bnb
   bun install
   cd evm && forge install
   cd backend && uv sync
   ```

2. **Build the extension**
   ```bash
   bun run build-extension
   ```

3. **Deploy smart contracts**
   ```bash
   cd evm
   forge script script/DeployCryptoBnB.s.sol --rpc-url $RPC_URL --broadcast
   ```

4. **Start the backend**
   ```bash
   cd backend
   uv run fastapi dev main.py
   ```

## 📍 Deployed Contract

**Address**: `0xc6BB3C35f6a80338C49C3e4F2c083f21ac36d693`

**Networks**:
- BNB Smart Chain: https://bscscan.com/address/0xc6bb3c35f6a80338c49c3e4f2c083f21ac36d693
- CELO: https://celo.blockscout.com/address/0xc6bb3c35f6a80338c49c3e4f2c083f21ac36d693
- Moonbeam: https://moonbeam.moonscan.io/address/0xc6bb3c35f6a80338c49c3e4f2c083f21ac36d693
- TAC (TON): https://explorer.tac.build/address/0xc6bb3c35f6a80338c49c3e4f2c083f21ac36d693

**Features**: ERC20 support, native token payments, Chainlink price feeds, access control, reentrancy protection

## 🔧 Browser Extension

### Build & Install

1. **Build the extension**
   ```bash
   bun run build-extension
   ```

2. **Install in Chrome/Edge/Brave**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select `dist/extension/`

3. **Test**
   - Navigate to any e-commerce site
   - Extension should detect payment forms
   - Click extension icon to connect wallet

## 🔒 Security

- Smart contracts use battle-tested libraries (OpenZeppelin, Solady)
- Role-based access controls and reentrancy protection
- Secure wallet integration without exposing private keys
- Backend validates all blockchain events

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for code style, testing requirements, and pull request process.

## 📜 License

MIT License - see the LICENSE file for details.

---

**PayperPlane** - Bridging the gap between crypto and commerce, one transaction at a time. 🚀