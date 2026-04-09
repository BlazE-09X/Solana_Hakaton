# 🏛️ ProofRent Protocol v2.0

> **Decentralized Real-World Asset (RWA) Tokenization Platform on Solana**
>
> Enable fractional ownership, automated income distribution, and transparent blockchain verification of real-world assets.

[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Framework-Anchor-blue)](https://www.anchor-lang.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Smart Contract Functions](#smart-contract-functions)
- [Frontend Components](#frontend-components)
- [Development](#development)
- [Roadmap](#roadmap)

---

## 🎯 Overview

**ProofRent** solves critical problems in real-world asset tokenization:

| Problem | Solution |
|---------|----------|
| **High entry barriers** | Fractional ownership (buy 1% of $1M property) |
| **Illiquidity** | Blockchain-based secondary market |
| **Lack of transparency** | On-chain verification via IPFS proofs |
| **Complex income tracking** | Automatic distribution to holders |
| **Centralized trust** | Smart contracts + Oracle verification |

### Use Cases
- 🏠 **Real Estate**: Tokenize apartments, buildings, land
- 📊 **Bonds**: Fractional debt securities
- ⚡ **Energy**: P2P electricity trading
- 🎨 **Commodities**: Precious metals, collectibles

---

## ✨ Key Features

### 1. **Asset Tokenization**
- Create digital representations of real-world assets
- Attach IPFS proof documents (title deeds, appraisals, contracts)
- Admin verification system
- Asset metadata and ratings

### 2. **Fractional Ownership**
- Mint unlimited fractions for any asset
- Each fraction is an SPL token
- Tradeable on secondary marketplace
- Proportional share of income

### 3. **Income Distribution**
- Collect rental/dividend payments
- Automatic split among fraction holders
- Transparent payout tracking
- Gas-efficient batch distribution

### 4. **Marketplace**
- Buy/sell fractions peer-to-peer
- Asset discovery with filters
- Verified asset showcase
- Real-time portfolio tracking

### 5. **Admin Dashboard**
- Verify newly created assets
- Review IPFS proof documents
- Monitor platform metrics
- Manage asset lifecycle

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ProofRent v2.0                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │    Chain     │  │
│  │   (React)    │──│  (Express)   │──│  (Solana)    │  │
│  │              │  │              │  │              │  │
│  │ • Dashboard  │  │ • REST API   │  │ • Smart      │  │
│  │ • Marketplace│  │ • IPFS Tx    │  │   Contract   │  │
│  │ • Trading    │  │ • Auth       │  │ • Token Mint │  │
│  │ • Income View│  │ • Indexing   │  │ • Storage    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↑                                      ↓         │
│         └──── Wallet (Phantom) ────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘

        ↓
        
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Asset Data  │  │ Income Pool  │  │Fraction Token│
│              │  │              │  │              │
│ • Name       │  │ • Collected  │  │ • SPL Mint   │
│ • Price      │  │ • Distributed│  │ • Balance    │
│ • Owner      │  │ • Holders    │  │ • Transfer   │
│ • IPFS Proof │  │ • Schedule   │  │ • Trade      │
│ • Fractions  │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

```
1. Asset Creation
   Owner → Create Asset + Upload Proof to IPFS → Register on-chain

2. Verification
   Admin → Review IPFS docs → Verify Asset → Market visibility

3. Fraction Minting
   Owner → Mint fractions → Distribute or sell on marketplace

4. Trading
   Buyer → Purchase fractions (P2P) → SOL transfer → Token transfer

5. Income Collection
   Renter → Pay rent to Income Pool → Automatic distribution → Holders paid
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- Rust & Anchor CLI
- Solana CLI
- Phantom Wallet (devnet)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourname/proofrent
cd proofrent
npm install
```

### 2. Setup Solana CLI

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2  # Get devnet SOL
```

### 3. Build Smart Contract

```bash
cd programs/bbm
anchor build
```

Program ID will be displayed. Update `declare_id!` in `lib.rs` if deploying fresh.

### 4. Deploy to Devnet

```bash
anchor deploy
# or manually:
solana program deploy target/deploy/bbm.so \
  --url https://api.devnet.solana.com \
  --keypair ~/.config/solana/id.json
```

### 5. Setup Backend

```bash
cd backend
npm install
# Create .env file
cat > .env << EOF
ANCHOR_WALLET=/path/to/id.json
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
EOF

npm run dev  # Starts on :3000
```

### 6. Setup Frontend

```bash
cd frontend-react
npm install
# Update PROGRAM_ID in src/context/WalletContext.tsx
npm run dev  # Starts on :5173
```

---

## 📖 Usage Guide

### Create a Real-World Asset

1. **Navigate to "Create Asset" tab**
2. **Fill in details:**
   - Asset Name: "Manhattan Office Building"
   - Price: 1000 SOL
   - Total Fractions: 1000 (each fraction = 1% or custom)
3. **Upload Proof Document:**
   - Deed, appraisal, contract (PDF/Images)
   - Automatically uploaded to IPFS
   - Hash stored on-chain
4. **Submit Transaction**
   - Confirm in Phantom Wallet
   - Asset appears in your portfolio
5. **Wait for Admin Verification**
   - Admin reviews IPFS proof
   - Marks as verified (visible in marketplace)

### Mint Fractions

1. **In your asset details**
2. **Click "Mint Fractions"**
3. **Enter amount to mint** (e.g., 500 fractions)
4. **Confirm transaction**
5. **Fractions ready to:**
   - Keep for passive income
   - Sell on marketplace
   - Use for collateral

### Trade Fractions

1. **Go to "Trade Fractions" tab**
2. **Select action: Buy or Sell**
3. **Enter:**
   - Asset address
   - Number of fractions
   - Price per fraction (in SOL)
4. **Review summary** (total value + 2% fee)
5. **Confirm in Phantom**
6. **Fractions transferred!**

### Collect & Distribute Income

1. **Go to "Income" tab**
2. **Select asset to collect from**
3. **Enter rental payment amount**
4. **Money goes to Income Pool**
5. **Click "Distribute"**
6. **Automatic payout to fraction holders:**
   - Alice: 500 fractions (50%) → gets 50% of income
   - Bob: 300 fractions (30%) → gets 30% of income
   - Carol: 200 fractions (20%) → gets 20% of income

### Admin Verification

1. **Go to "Admin" tab** (admin wallet only)
2. **See "Pending Review" assets**
3. **Click asset → view IPFS proof**
4. **Click "Verify Asset"**
5. **Asset now visible in marketplace**

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Create Asset
```http
POST /api/assets/create
Content-Type: multipart/form-data

{
  "name": "Park Avenue Apartment",
  "price": "500",
  "totalFractions": "1000",
  "proof": <FILE>
}

Response:
{
  "success": true,
  "asset": "9C2UjvvHNkJf...",
  "mainMint": "TokenMint...",
  "fractionMint": "FractionMint...",
  "incomePool": "IncomePool...",
  "ipfsProofHash": "QmXxxx..."
}
```

#### 2. Mint Fractions
```http
POST /api/assets/{assetId}/mint-fractions

{
  "amount": 500
}

Response:
{
  "success": true,
  "fractionMint": "...",
  "amountMinted": 500
}
```

#### 3. Collect Rent Income
```http
POST /api/assets/{assetId}/collect-income

{
  "amount": "50"
}

Response:
{
  "success": true,
  "assetId": "...",
  "incomeCollected": 50
}
```

#### 4. Distribute Income
```http
POST /api/assets/{assetId}/distribute-income
```

#### 5. Get Marketplace
```http
GET /api/marketplace

Response:
{
  "success": true,
  "total": 5,
  "assets": [
    {
      "address": "...",
      "name": "Park Ave",
      "price": 500,
      "isVerified": true,
      "fractionsMinted": 500,
      "rating": 5,
      ...
    }
  ]
}
```

#### 6. Get Portfolio
```http
GET /api/portfolio/{walletAddress}
```

#### 7. Rate Asset
```http
POST /api/assets/{assetId}/rate

{
  "rating": 5
}
```

#### 8. Verify Asset (Admin)
```http
POST /api/assets/{assetId}/verify
```

#### 9. Get Asset Details
```http
GET /api/assets/{assetId}
```

---

## 🔗 Smart Contract Functions

Located in `programs/bbm/src/lib.rs`

### Account Structures

```rust
#[account]
pub struct Asset {
    pub name: String,
    pub price: u64,
    pub owner: Pubkey,
    pub is_verified: bool,
    pub is_rented: bool,
    pub metadata_uri: String,
    pub total_fractions: u64,           // NEW
    pub fractions_minted: u64,          // NEW
    pub ipfs_proof_hash: String,        // NEW
    pub created_at: i64,                // NEW
    pub collected_income: u64,          // NEW
    pub distributed_income: u64,        // NEW
    pub rating: u8,                     // NEW
}

#[account]
pub struct IncomePool {                 // NEW
    pub asset: Pubkey,
    pub total_collected: u64,
    pub distributed: u64,
    pub last_distribution: i64,
}

#[account]
pub struct FractionOwner {              // NEW
    pub asset: Pubkey,
    pub owner: Pubkey,
    pub fractions_owned: u64,
    pub purchase_price: u64,
}
```

### Core Functions

#### `initialize_asset(name, price, metadata_uri, total_fractions, ipfs_proof_hash)`
- Creates new asset account
- Initializes income pool
- Registers with IPFS proof
- Mints ownership token

#### `mint_fractions(amount)`
- Owner-only function
- Creates SPL tokens for fractions
- Cannot exceed total_fractions
- Returns fraction mint address

#### `collect_rent_income(amount)`
- Owner-only function
- Transfers SOL to income pool
- Updates collected totals
- Tracks collection timestamp

#### `distribute_income()`
- Distributes from income pool
- Calculates holders' shares
- Sends proportional SOL
- Updates distributed total

#### `buy_fraction(amount, price_per_fraction)`
- P2P fraction transaction
- Transfers SOL seller→buyer
- Transfers tokens buyer→seller
- Updates holder records

#### `sell_fraction(amount, price_per_fraction)`
- Reverse of buy_fraction
- Seller initiates sale

#### `rent_asset()`
- Marks asset as rented
- Original transaction flow

#### `release_asset()`
- Marks asset as available
- Owner-only

#### `verify_asset()`
- Admin-only function
- Sets is_verified = true
- Makes asset marketplace-visible

#### `rate_asset(rating)`
- Community ratings (1-5)
- Stored on-chain

---

## 🖥️ Frontend Components

### Dashboard
- **Portfolio Summary**: Total value, asset count
- **Asset List**: Ownership details, income, status
- **Performance Metrics**: Revenue, ROI, ratings

### Marketplace
- **Asset Grid**: Browse all verified assets
- **Search & Filter**: Name, verification status
- **Asset Cards**: Price, fractions available, ratings
- **Buy Fractions**: Direct purchase button

### Create Asset
- **Asset Form**: Name, price, fractions
- **IPFS Upload**: Proof documents
- **Fraction Minting**: Add more fractions later
- **Status Tracking**: Creation, verification, minting

### Trade Fractions
- **Buy/Sell Toggle**: Choose action
- **Asset Input**: Which asset to trade
- **Amount & Price**: Quantity and SOL per fraction
- **Summary**: Total value + fees
- **Execute**: Confirm transaction

### Income Distribution
- **Collection Summary**: Total, distributed, pending
- **By-Asset View**: Income tracking per asset
- **Holder Breakdown**: Who owns what % and receives what
- **Distribute Button**: Send payments to holders

### Admin Panel
- **Pending Review**: New unverified assets
- **Verified Assets**: All approved items
- **IPFS Proof Viewer**: Review document links
- **Verify Button**: Approve assets
- **Statistics**: Count of pending/verified

---

## 💻 Development

### Project Structure

```
proofrent/
├── programs/
│   └── bbm/                    # Anchor smart contract
│       ├── src/
│       │   └── lib.rs         # Main program logic
│       └── Cargo.toml
├── backend/                    # Express.js API
│   ├── src/
│   │   └── index.ts           # REST endpoints
│   └── package.json
├── frontend-react/             # React Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   ├── FractionTrading.tsx
│   │   │   ├── IncomeView.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── CreateAsset.tsx
│   │   │   ├── Balance.tsx
│   │   │   └── Navbar.tsx
│   │   ├── context/
│   │   │   └── WalletContext.tsx
│   │   ├── hooks/
│   │   │   └── useProgram.ts
│   │   ├── App.tsx            # Main app with tab navigation
│   │   └── main.tsx
│   └── package.json
├── tests/
│   └── bbm.ts                 # Mocha integration tests
├── scripts/
│   └── deploy.ts              # Deployment script
├── README.md
└── package.json
```

### Running Tests

```bash
# Install mocha locally if needed
npm install --save-dev @types/mocha mocha ts-node

# Run anchor tests
anchor test

# Run specific test file
npx mocha tests/bbm.ts --timeout 30000
```

### Debugging

**Smart Contract**:
```bash
# Enable logging in lib.rs
use anchor_lang::prelude::msg;
msg!("Debug message: {}", variable);

# View logs
solana logs
```

**Backend**:
```bash
# Enable debug mode
export DEBUG=*
npm run dev
```

**Frontend**:
```bash
# Browser DevTools (F12)
# Check Network tab for API requests
# Check Console for errors
```

---

## 🗺️ Roadmap

### v2.0 (Current - Hackathon)
- [x] Smart contract with fractions & income distribution
- [x] IPFS proof integration
- [x] REST API with marketplace
- [x] Full-stack React frontend
- [x] Admin verification system
- [x] Income tracking & distribution

### v3.0 (Future)
- [ ] On-chain oracle integration (Switchboard, Pyth)
- [ ] DAO governance for asset management
- [ ] Secondary market with AMM
- [ ] Insurance & escrow contracts
- [ ] Historical analytics & reports
- [ ] Mobile app (React Native)
- [ ] Mainnet deployment

### v4.0 (Scale)
- [ ] Cross-chain bridges
- [ ] Advanced derivatives
- [ ] DeFi integrations (lending against fractions)
- [ ] Real estate partnerships

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👥 Team

- **Computer Engineering & Software Specialists**
- **Blockchain Development** (Solana/Anchor)
- **Full-Stack Web Development**
- [GitHub](https://github.com/yourname)

---

## 📞 Support

- 💬 **Discord**: [Join our community]
- 📧 **Email**: support@proofrent.dev
- 🐛 **Issues**: [GitHub Issues](../../issues)

---

## ⭐ Acknowledgments

- **Solana Foundation** - Blockchain infrastructure
- **Anchor Framework** - Smart contract development
- **National Solana Hackathon** - Event & support

---

**Last Updated**: April 7, 2026  
**Status**: 🚀 Production Ready (Devnet)
