# PayperPlane - Universal Crypto Payment Solution

## 🚀 The Vision

PayperPlane is a revolutionary browser extension that bridges the gap between cryptocurrency holders and traditional e-commerce platforms. It enables users to pay with crypto on ANY website that accepts card payments - even if the merchant doesn't support cryptocurrency.

### The Problem We Solve
- **85% of online merchants** don't accept cryptocurrency payments
- **Crypto holders** want to spend their assets without selling first
- **Traditional payment integration** is complex and expensive for merchants
- **Geographic restrictions** limit access to certain payment methods
- **Privacy concerns** with sharing financial data online

### Our Solution
A seamless browser extension that:
- **Detects payment forms** automatically on any e-commerce site
- **Converts crypto to fiat** instantly in the background
- **Issues virtual cards** on-demand for each transaction
- **Works everywhere** - no merchant integration required

## 🏗️ Architecture Overview

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser Extension │ ←──→│   Smart Contract │ ←──→│   Backend API   │
│   (Content Script)  │     │   (CryptoBnB)    │     │   (FastAPI)     │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
         ↓                           ↓                         ↓
   Detects Forms              Handles Funding           Issues Cards
   Injects UI                 Stores Events             Processes Payments
   Wallet Connect             Admin Controls            Monitors Chain
```

## 📁 Project Structure

```
crypto-bnb/
├── extension/              # Browser extension (Chrome/Edge/Brave)
│   ├── content/           # Content scripts for payment detection
│   ├── background/        # Service worker for extension logic
│   ├── popup/             # Extension popup UI (React)
│   └── inject/            # Wallet connection scripts
│
├── evm/                   # Smart contracts (Solidity)
│   ├── src/              # Contract source code
│   ├── test/             # Comprehensive test suite
│   └── script/           # Deployment scripts
│
├── backend/              # Backend API (Python/FastAPI)
│   └── main.py          # API endpoints
│
├── payperplane-react/    # Landing page (React/Vite)
│   ├── src/             # React components
│   └── public/          # Static assets
│
└── shared/              # Shared TypeScript types
```

## 🎯 Key Features

### For Users
- **Universal Compatibility** - Works on ANY site with card payments
- **No Merchant Integration** - Sites don't need to support crypto
- **Instant Conversion** - Crypto to fiat in seconds
- **Privacy First** - No bank details shared with merchants
- **Multi-Currency** - Support for major cryptocurrencies
- **Global Access** - No geographic restrictions

### For Developers
- **Modular Architecture** - Clean separation of concerns
- **Gas Efficient** - Optimized smart contracts using Solady
- **Type Safe** - Shared TypeScript interfaces
- **Well Tested** - Comprehensive test coverage
- **Event Driven** - Reliable blockchain event handling

## 🛠️ Technical Stack

### Frontend
- **Extension**: TypeScript, Chrome Extension Manifest V3, WAGMi
- **Landing Page**: React, Vite, Tailwind CSS
- **Package Manager**: Bun (faster than npm)
- **Build Tools**: Vite, TypeScript Compiler

### Smart Contracts
- **Language**: Solidity 0.8+
- **Framework**: Foundry (Forge)
- **Libraries**: OpenZeppelin, Solady, Chainlink
- **Testing**: Forge test suite with 17+ test cases

### Backend
- **Framework**: FastAPI (Python)
- **Package Manager**: UV (modern Python packaging)
- **Architecture**: RESTful API, Event listeners

## 💡 Key Innovations

### 1. **Payment Form Detection**
The extension uses sophisticated DOM parsing to identify payment forms on any website, regardless of the site's structure or framework.

### 2. **Seamless Wallet Integration**
Custom event system allows secure communication between the extension and web3 wallets without exposing sensitive data.

### 3. **Smart Contract Efficiency**
The CryptoBnB contract is designed for minimal gas usage:
- Uses Solady for optimized operations
- Supports both ERC20 and native tokens
- Event-driven architecture for backend integration

### 4. **Virtual Card Generation**
Backend instantly generates single-use virtual cards for each transaction, ensuring security and privacy.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Bun
- Foundry (for smart contract development)
- Python 3.9+ and UV (for backend)
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/crypto-bnb.git
   cd crypto-bnb
   ```

2. **Install dependencies**
   ```bash
   # Extension and React app
   bun install
   
   # Smart contracts
   cd evm && forge install
   
   # Backend
   cd backend && uv sync
   ```

3. **Build the extension**
   ```bash
   bun run build-extension
   ```

4. **Deploy smart contracts**
   ```bash
   cd evm
   forge script script/DeployCryptoBnB.s.sol --rpc-url $RPC_URL --broadcast
   ```

5. **Start the backend**
   ```bash
   cd backend
   uv run fastapi dev main.py
   ```

## 📊 Key Takeaways

### Technical Excellence
- **Clean Architecture**: Modular design with clear separation between extension, contracts, and backend
- **Security First**: Reentrancy protection, access controls, and secure wallet integration
- **Performance Optimized**: Gas-efficient contracts and fast extension performance
- **Developer Friendly**: TypeScript, comprehensive testing, and clear documentation

### Business Innovation
- **Market Opportunity**: Unlocks crypto payments for 85% of e-commerce sites
- **Zero Integration**: Merchants don't need to change anything
- **Global Reach**: Works anywhere, bypassing traditional payment restrictions
- **Privacy Enhanced**: Users don't share financial details with merchants

### User Experience
- **Seamless Integration**: Works like magic - detect, click, pay
- **Familiar Flow**: Users shop normally until checkout
- **Instant Gratification**: No waiting for merchant adoption
- **Full Control**: Users choose when and how to pay with crypto

## 🔒 Security Considerations

- **Smart Contract Auditing**: Contracts use battle-tested libraries (OpenZeppelin, Solady)
- **Access Controls**: Role-based permissions for admin functions
- **Event Validation**: Backend verifies all blockchain events
- **Secure Communication**: Extension uses secure message passing
- **Private Keys**: Never exposed or transmitted

## 🌟 Future Enhancements

- **Multi-chain Support**: Expand beyond BSC to Ethereum, Polygon, etc.
- **More Cryptocurrencies**: Add support for additional tokens
- **Mobile Integration**: Develop mobile browser extensions
- **Loyalty Rewards**: Cashback in crypto for users
- **B2B Solutions**: Enterprise virtual card management

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Web3 technologies and modern development practices
- Inspired by the need to make crypto more accessible
- Thanks to the open-source community for amazing tools

---

**PayperPlane** - Bridging the gap between crypto and commerce, one transaction at a time. 🚀