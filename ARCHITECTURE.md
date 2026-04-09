# Architecture Documentation - ProofRent v2.0

## System Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │      User Devices (Client)          │
                        │  ┌──────────────────────────────┐  │
                        │  │  React Web App (Vite)        │  │
                        │  │  • Dashboard                  │  │
                        │  │  • Marketplace                │  │
                        │  │  • Trading                    │  │
                        │  │  • Income Tracking            │  │
                        │  │  • Admin Panel                │  │
                        │  └──────────────────────────────┘  │
                        │           ↑        ↓                │
                        │      Phantom Wallet                 │
                        └──────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ↓                                     ↓
        ┌─────────────────────────┐        ┌──────────────────────┐
        │   Backend Server        │        │   Solana Network     │
        │   (Express.js :3000)    │        │   (Devnet)           │
        │                         │        │                      │
        │ ┌─────────────────────┐ │        │  ┌────────────────┐  │
        │ │  REST API Routes    │ │        │  │ Smart Contract │  │
        │ │ • /api/assets/*     │ │        │  │ (program bbm)  │  │
        │ │ • /api/marketplace  │ │        │  │                │  │
        │ │ • /api/portfolio/*  │ │        │  │ Program ID:    │  │
        │ │ • /api/income/*     │ │        │  │ CJMFFyVCeUq..  │  │
        │ └─────────────────────┘ │        │  └────────────────┘  │
        │           ↑             │        │           ↑           │
        │ ┌─────────────────────┐ │        │  ┌────────────────┐  │
        │ │  Service Layer      │ │        │  │  On-Chain Data │  │
        │ │ • IPFS Upload       │ │        │  │ • Asset Accounts│ │
        │ │ • Signature Verify  │ │        │  │ • Income Pools │  │
        │ │ • Event Indexing    │ │        │  │ • SPL Tokens   │  │
        │ │ • Data Caching      │ │        │  │ • Tx History   │  │
        │ └─────────────────────┘ │        │  └────────────────┘  │
        │           ↑             │        │                      │
        │ ┌─────────────────────┐ │        └──────────────────────┘
        │ │ Data Store          │ │
        │ │ • In-Memory Cache   │ │
        │ │ • Asset Registry    │ │
        │ │ • User Sessions     │ │
        │ └─────────────────────┘ │
        └─────────────────────────┘
               ↑          ↓
        ┌──────────────────────────┐
        │   External Services      │
        ├──────────────────────────┤
        │ • IPFS (Pinata/Local)   │ ← Proof documents
        │ • Solana RPC            │ ← Chain communication
        │ • SPL Token Program     │ ← Token minting
        └──────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Asset Creation Flow

```
User (Frontend)
      ↓
   [Create Asset Form]
      ├─ Name
      ├─ Price (SOL)
      ├─ Total Fractions
      └─ Proof Document (PDF/Image)
      ↓
   [Document Upload to IPFS]
      ↓
   [Backend: /api/assets/create]
      ├─ Validate inputs
      ├─ Upload file to IPFS
      ├─ Get IPFS hash
      └─ Prepare transaction
      ↓
   [Anchor Program: initialize_asset()]
      ├─ Create Asset account
      ├─ Create IncomePool account
      ├─ Store metadata + IPFS hash
      ├─ Create SPL Mint for ownership
      └─ Mint initial token to owner
      ↓
   [Transaction signed by user]
      ↓
   [Asset stored on-chain]
      ↓
   [Status: Pending Admin Verification]
      ↓
   [Admin Reviews & Verifies]
      ↓
   [Asset now Marketplace-Visible]
```

### 2. Fraction Trading Flow

```
Seller (Owns Fractions)
      ↓
   [Fraction Trading Component]
      ├─ Select "Sell"
      ├─ Asset address
      ├─ Number of fractions
      └─ Price per fraction
      ↓
   [Backend: /api/assets/:id/sell-fraction]
      ├─ Validate seller ownership
      ├─ Calculate total price
      └─ Prepare P2P transaction
      ↓
   [Smart Contract: sell_fraction()]
      ├─ Transfer SOL: buyer → seller
      ├─ Transfer fractions: seller → buyer
      ├─ Update FractionOwner account
      └─ Log transaction
      ↓
   Buyer (Receives Fractions)
      ├─ Fractions appear in wallet
      ├─ Can now collect income
      └─ Can resell or hold
```

### 3. Income Distribution Flow

```
Renter/Tenant
      ↓
   [Pay Rent to Asset]
      ↓
   [Backend: /api/assets/:id/collect-income]
      ├─ Amount in SOL
      └─ Validate owner
      ↓
   [Smart Contract: collect_rent_income()]
      ├─ Transfer SOL → IncomePool
      ├─ Update collected_income
      └─ Track collection timestamp
      ↓
   [IncomePool Account]
      ├─ Receives rent payment
      ├─ Accumulates for distribution
      └─ Stores holder distribution data
      ↓
   [Asset Owner Initiates Distribution]
      ↓
   [Backend: /api/assets/:id/distribute-income]
      ↓
   [Smart Contract: distribute_income()]
      ├─ For each fraction holder:
      │  ├─ Calculate share: (fractions_owned / total_fractions) * income
      │  └─ Transfer SOL to holder
      └─ Update distributed_income
      ↓
   [Multiple Fraction Holders]
      ├─ Alice (50%): Receives 50% of income
      ├─ Bob (30%): Receives 30% of income
      └─ Carol (20%): Receives 20% of income
```

---

## Component Breakdown

### Frontend (React)

#### Dashboard Component
- **Purpose**: Personal portfolio overview
- **Data Sources**:
  - `/api/portfolio/:wallet` - User's assets
  - `/api/assets/:id` - Individual asset details
- **Features**:
  - Portfolio value calculation
  - Asset list with status
  - Income tracking per asset
- **Refreshes**: Every 30 seconds

#### Marketplace Component
- **Purpose**: Browse all verified assets
- **Data Sources**:
  - `/api/marketplace` - All assets
- **Features**:
  - Asset grid/list view
  - Search & filtering
  - Verified badge
  - Quick buy button
- **Refreshes**: Every 60 seconds

#### CreateAsset Component
- **Purpose**: Tokenize new RWA
- **Data Sources**:
  - `/api/portfolio/:wallet` - My assets
- **Features**:
  - Asset details form
  - IPFS proof upload
  - Fraction minting
  - Status tracking
- **Actions**:
  - POST `/api/assets/create`
  - POST `/api/assets/:id/mint-fractions`

#### FractionTrading Component
- **Purpose**: P2P fraction marketplace
- **Features**:
  - Buy/Sell toggle
  - Price calculation
  - Fee display (2%)
  - Order summary
- **Actions**:
  - POST `/api/assets/:id/buy-fraction`
  - POST `/api/assets/:id/sell-fraction`

#### IncomeView Component
- **Purpose**: Manage rental payments
- **Data Sources**:
  - `/api/portfolio/:wallet` - Income data
- **Features**:
  - Total collected/distributed
  - By-asset breakdown
  - Holder list with shares
  - Distribution button
- **Actions**:
  - POST `/api/assets/:id/collect-income`
  - POST `/api/assets/:id/distribute-income`

#### AdminPanel Component
- **Purpose**: Verify new assets
- **Features**:
  - Pending assets list
  - IPFS proof viewer
  - Verify button
  - Statistics dashboard
- **Admin Check**: `publicKey === ADMIN_WALLET`
- **Actions**:
  - POST `/api/assets/:id/verify`

### Backend (Express.js)

#### Service Layer

**AssetService**
```typescript
- createAsset(name, price, fractions, proof)
- mintFractions(assetId, amount)
- collectIncome(assetId, amount)
- distributeIncome(assetId)
- rateAsset(assetId, rating)
- verifyAsset(assetId)
```

**IPFSService**
```typescript
- uploadFile(file)
- getFileUrl(hash)
```

**AuthService**
```typescript
- verifyWalletSignature(message, signature)
- requireAdmin()
```

**IndexingService**
```typescript
- trackNewAssets()
- updateAssetStatus()
- indexTransactions()
```

#### Routes

```
POST   /api/assets/create              → createAsset()
POST   /api/assets/:id/mint-fractions  → mintFractions()
POST   /api/assets/:id/collect-income  → collectIncome()
POST   /api/assets/:id/distribute-income → distributeIncome()
POST   /api/assets/:id/rate            → rateAsset()
POST   /api/assets/:id/verify          → verifyAsset(admin)
GET    /api/assets/:id                 → getAssetDetails()
GET    /api/marketplace                → getAllAssets()
GET    /api/portfolio/:wallet          → getUserAssets()
```

### Smart Contract (Anchor)

#### Program Accounts

**Asset Account** (252+ bytes)
```rust
pub struct Asset {
    pub name: String,              // 50 bytes
    pub price: u64,                // 8 bytes
    pub owner: Pubkey,             // 32 bytes
    pub is_verified: bool,         // 1 byte
    pub is_rented: bool,           // 1 byte
    pub metadata_uri: String,      // 50 bytes
    pub total_fractions: u64,      // 8 bytes
    pub fractions_minted: u64,     // 8 bytes
    pub ipfs_proof_hash: String,   // 46 bytes
    pub created_at: i64,           // 8 bytes
    pub collected_income: u64,     // 8 bytes
    pub distributed_income: u64,   // 8 bytes
    pub rating: u8,                // 1 byte
    // Reserved: 40 bytes
}
```

**IncomePool Account** (200 bytes)
```rust
pub struct IncomePool {
    pub asset: Pubkey,             // 32 bytes
    pub total_collected: u64,      // 8 bytes
    pub distributed: u64,          // 8 bytes
    pub last_distribution: i64,    // 8 bytes
    // Reserved: 144 bytes
}
```

**FractionOwner Account** (128 bytes)
```rust
pub struct FractionOwner {
    pub asset: Pubkey,             // 32 bytes
    pub owner: Pubkey,             // 32 bytes
    pub fractions_owned: u64,      // 8 bytes
    pub purchase_price: u64,       // 8 bytes
    // Reserved: 48 bytes
}
```

#### Instructions

```
initialize_asset(name, price, total_fractions, ipfs_hash)
  ├─ Create Asset account
  ├─ Create IncomePool
  └─ Mint NFT ownership token

mint_fractions(amount)
  ├─ Validate owner
  ├─ Check total < totalFractions
  └─ Mint SPL tokens

collect_rent_income(amount)
  ├─ Validate owner
  ├─ Transfer SOL → IncomePool
  └─ Update collected total

distribute_income()
  ├─ For each fraction holder
  ├─ Calculate share
  └─ Transfer SOL

buy_fraction(amount, price)
  ├─ Transfer SOL seller ← buyer
  └─ Transfer tokens buyer ← seller

sell_fraction(amount, price)
  └─ Reverse of buy_fraction

rent_asset()
  └─ Set is_rented = true

release_asset()
  └─ Set is_rented = false

verify_asset()
  └─ Set is_verified = true (admin)

rate_asset(rating)
  └─ Update rating (1-5)
```

---

## Security Architecture

### Authentication & Authorization

```
Frontend (Phantom)
    ↓ [Signs transaction with private key]
    ↓
Smart Contract
    ↓ [Verifies signer is msg.sender]
    ↓
Instruction Constraint
    ├─ Signer check
    ├─ Owner check (has_one = owner)
    └─ Account validation
```

### Key Security Features

1. **Signer Verification**
   ```rust
   pub owner: Signer<'info>  // Ensures transaction signer
   ```

2. **Owner Checks**
   ```rust
   #[account(mut, has_one = owner)]  // Validates ownership
   pub asset: Account<'info, Asset>,
   ```

3. **Admin-Only Functions**
   ```rust
   pub fn verify_asset(...) -> Result<()> {
       require_eq!(user.key(), ADMIN_PUBKEY, ErrorCode::Unauthorized);
       ...
   }
   ```

4. **Amount Validation**
   ```rust
   require!(
       asset.fractions_minted + amount <= asset.total_fractions,
       ErrorCode::ExcessiveAmount
   );
   ```

5. **State Validation**
   ```rust
   require!(asset.is_rented, ErrorCode::AssetNotRented);
   ```

---

## Data Storage Architecture

### Backend Cache (In-Memory)

```typescript
const assetsStore = new Map<string, AssetData>();

// On startup:
// 1. Fetch all assets from Solana
// 2. Load into memory
// 3. Subscribe to updates via Anchor events

// On request:
// 1. Check cache
// 2. Serve if fresh
// 3. Refresh from chain if needed
```

### On-Chain Storage

**Total Storage per Asset**:
- Asset Account: 512 bytes
- IncomePool Account: 200 bytes
- FractionOwner Accounts: 128 bytes each
- SPL Tokens: Created separately

**Rent Exemption Cost** (Devnet):
- Asset: ~4.14 SOL
- IncomePool: ~2.14 SOL

---

## Scalability Plan

### Current Limitations

- **On-Chain**:
  - Max 10MB per transaction
  - String storage is expensive
  - Each asset = separate accounts

- **Backend**:
  - In-memory cache only
  - No persistence
  - Single-threaded

### Optimization Strategy

**Phase 1** (Current):
- Accept limitations
- Works well for <1000 assets

**Phase 2** (v3.0):
- Implement database (PostgreSQL)
- Real-time event streaming
- Batch operations

**Phase 3** (v4.0):
- Off-chain storage (Arweave)
- Indexing service (Colosseum)
- Advanced caching

**Phase 4** (Mainnet):
- Sharded storage
- Optimized transaction batching
- Cross-chain bridges

---

## Deployment Architecture

### Development Environment

```
Local Machine
├─ Solana (Devnet connection)
├─ Anchor (Program compilation)
├─ Backend (Node.js :3000)
├─ Frontend (Vite :5173)
└─ Phantom Wallet (Browser extension)
```

### Production Environment (Future)

```
AWS/GCP Cloud
├─ API Server (Compute)
├─ Database (PostgreSQL)
├─ IPFS Node (Storage)
├─ Solana RPC (Validator)
└─ CDN (Frontend distribution)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Solana + Anchor |
| **Smart Contracts** | Rust |
| **Frontend** | React + TypeScript + Vite |
| **Backend** | Express.js + TypeScript |
| **Storage** | IPFS (Pinata) |
| **Wallet** | Phantom |
| **Testing** | Mocha + Chai |

---

## Monitoring & Analytics (Future)

```
Events Flow:
Smart Contract → Event Logs
    ↓
Indexer Service
    ↓
Database
    ↓
Analytics Dashboard
```

---

**Last Updated**: April 7, 2026
