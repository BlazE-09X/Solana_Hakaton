# ProofRent Demo Walkthrough

## Quick Start Demo (5 minutes)

This demo shows how to use ProofRent for tokenizing real-world assets and managing fractional ownership.

---

## Prerequisites

```bash
# Install dependencies
npm install
cd frontend-react && npm install
cd ../backend && npm install
```

## Step-by-Step Demo

### Step 1️⃣: Start Backend Server

```bash
cd backend
npm run dev
# Output: Backend running on http://localhost:3000
```

### Step 2️⃣: Start Frontend App

```bash
# In another terminal
cd frontend-react
npm run dev
# Output: Local: http://localhost:5173
# Open in browser
```

### Step 3️⃣: Connect Wallet

1. **Click "Select Wallet"** in top-right
2. **Choose Phantom**
3. **Approve connection** in popup
4. You should see your devnet SOL balance

> 💡 **Tip**: If balance is 0:
> ```bash
> solana airdrop 2 --network devnet
> ```

---

## Demo Scenario: Create & Manage an Asset

### Scenario: Manhattan Office Park Tokenization

**Objective**: Tokenize a $500K office building into 5000 fractional shares

#### Phase 1: Asset Creation

1. **Navigate to "Create Asset" tab**
2. **Fill in details**:
   - **Asset Name**: "Manhattan Office Park"
   - **Price**: 500 SOL (representing $500K)
   - **Total Fractions**: 5000 (each = 0.1 SOL or 0.01%)
3. **Upload Proof Document**:
   - Download sample: `programs/bbm/sample_deed.pdf`
   - Or use any PDF/image
   - This gets uploaded to IPFS automatically
4. **Click "Create Asset & Upload Proof"**
5. **Confirm in Phantom wallet**
6. **Wait for confirmation** (~15 seconds)

**Expected Result**:
```
✅ Asset created! 
   ID: 9C2Ujvv... 
   IPFS: QmAbcd123...
```

---

#### Phase 2: Admin Verification

Now admin needs to verify the asset (in real scenario, different person)

1. **Switch to "Admin" tab**
2. **See "Pending Review" section**
3. **Find your asset** (Manhattan Office Park)
4. **Click to expand**
5. **View IPFS proof** (click link to see document)
6. **Click "Verify Asset"**
7. **Confirm in Phantom**

**Expected Result**:
```
✅ Asset verified successfully!
```

Asset now appears in **Marketplace** tab!

---

#### Phase 3: Mint Fractions

Owner now creates tradeable fractions

1. **Go to "Create Asset" tab**
2. **Find your asset** in "My Assets"
3. **Expand the asset**
4. **Enter "2500"** in "Fractions to mint" field
5. **Click "Mint"**
6. **Confirm in Phantom**

**Expected Result**:
```
✅ Successfully minted 2500 fractions!
   Fractions Minted: 2500/5000
   Available to Mint: 2500
```

---

#### Phase 4: View in Marketplace

Now the asset is public!

1. **Go to "Marketplace" tab**
2. **See all verified assets**
3. **Find "Manhattan Office Park"**
4. **Notice**:
   - ✅ Verified badge
   - Price: 500 SOL
   - Fractions: 2500/5000 minted
   - Status: Available
5. **Click "Buy Fractions"** button (for demo purposes)

---

#### Phase 5: Trading Fractions

Simulate fraction trading

1. **Go to "Trade Fractions" tab**
2. **Select "Buy Fractions"**
3. **Enter**:
   - Asset Address: [Your Manhattan asset address]
   - Number of Fractions: 100
   - Price per Fraction: 0.1 SOL
4. **Review Summary**:
   - Total Value: 10 SOL
   - Fee (2%): 0.2 SOL
   - **Total: 10.2 SOL**
5. **Click "Buy Fractions"**
6. **Confirm in Phantom**

**Expected Result**:
```
✅ Fractions purchased successfully!
   100 fractions bought at 0.1 SOL each
```

> 💡 **Note**: For demo, fractions are simulated. In production, SPL tokens transfer.

---

#### Phase 6: Collect Rental Income

Owner receives rent payment

1. **Go to "Income" tab**
2. **See "My Assets"** with pending income
3. **Click to expand "Manhattan Office Park"**
4. **Imagine we collected $50,000 rent (100 SOL)**:
   - Total Collected: 100 SOL
   - Distribution: 0% (not distributed yet)
   - Pending: 100 SOL
5. **Click "Distribute 100 SOL"**
6. **Confirm in Phantom**

**Expected Result**:
```
Income distributed to fraction holders:
- You (2500/5000 = 50%): 50 SOL
- Other holders (2500/5000 = 50%): 50 SOL
```

---

#### Phase 7: Check Dashboard

View your complete portfolio

1. **Go to "Dashboard" tab**
2. **See Portfolio Value**: 500 SOL (your asset worth)
3. **Your Assets**: 1 (Manhattan Office Park)
4. **Asset Details**:
   - Price: 500 SOL
   - Status: ✅ Verified
   - Fractions: 2500/5000
   - Rented: Available
   - Income: 100 SOL collected, 50 SOL distributed to you

---

## Advanced Demo: Multi-Asset Portfolio

### Create multiple assets:

```
Asset 1: Manhattan Apartment
- Price: 300 SOL
- Fractions: Create 3000, Mint 1500
- Income: 25 SOL/month

Asset 2: Brooklyn Commercial
- Price: 800 SOL  
- Fractions: Create 8000, Mint 4000
- Income: 60 SOL/month

Asset 3: Energy Credits
- Price: 150 SOL
- Fractions: Create 1500, Mint 750
- Income: 10 SOL/month
```

**Total Portfolio Value**: 1250 SOL  
**Monthly Income**: 95 SOL

---

## Backend API Testing (Optional)

Test API endpoints directly:

### 1. Get Marketplace
```bash
curl http://localhost:3000/api/marketplace
```

**Response**:
```json
{
  "success": true,
  "total": 1,
  "assets": [
    {
      "address": "9C2Ujvv...",
      "name": "Manhattan Office Park",
      "price": 500,
      "isVerified": true,
      "fractionsMinted": 2500,
      ...
    }
  ]
}
```

### 2. Get Portfolio
```bash
curl http://localhost:3000/api/portfolio/YOUR_WALLET_ADDRESS
```

### 3. Get Asset Details
```bash
curl http://localhost:3000/api/assets/ASSET_ADDRESS
```

### 4. Create Asset (with real file)
```bash
curl -X POST http://localhost:3000/api/assets/create \
  -F "name=Test Asset" \
  -F "price=100" \
  -F "totalFractions=1000" \
  -F "proof=@./sample_deed.pdf"
```

---

## Demo Metrics

After completing this demo:

| Metric | Value |
|--------|-------|
| Assets Created | 1+ |
| Fractions Minted | 2500+ |
| Marketplace Listings | 1+ |
| Portfolio Value | 500+ SOL |
| Income Collected | 100+ SOL |
| Holders | 1+ |

---

## Common Issues & Solutions

### Issue: "Phantom not connected"
**Solution**: 
- Refresh page
- Check Phantom is set to **Devnet** network
- Reconnect wallet

### Issue: "Insufficient balance for transaction"
**Solution**:
- Get testnet SOL: `solana airdrop 2 --network devnet`
- Wait ~30 seconds for confirmation

### Issue: Backend returns "Asset not found"
**Solution**:
- Ensure backend is running on :3000
- Check asset address is correct
- Refresh marketplace cache

### Issue: IPFS upload fails
**Solution**:
- File size should be < 5MB
- Use common formats: PDF, JPG, PNG, DOC
- Check backend logs for details

---

## Performance Benchmarks

```
Operation         | Time     | Gas Cost
================|==========|===========
Create Asset      | 3-5s     | ~0.05 SOL
Verify Asset      | 2-3s     | ~0.02 SOL
Mint Fractions    | 2-4s     | ~0.03 SOL
Collect Income    | 1-2s     | ~0.01 SOL
Distribute Income | 5-10s    | ~0.10 SOL
```

---

## Next Steps

After this demo, you can:

1. **Extend to Production**:
   - Deploy to Solana mainnet
   - Add proper authentication
   - Implement database persistence
   - Connect real IPFS node

2. **Add Features**:
   - Secondary marketplace with AMM
   - DAO governance
   - On-chain oracle for price feeds
   - Insurance contracts

3. **Scale the Platform**:
   - Support 10,000+ assets
   - Batch operations
   - Advanced analytics
   - Mobile app

---

## Video Demo Script (2-3 minutes)

```
[0:00] "Welcome to ProofRent, a decentralized RWA platform on Solana"
[0:05] "Today we'll tokenize a real office building"
[0:10] Show Dashboard with portfolio overview
[0:20] Navigate to Create Asset
[0:30] Fill in Manhattan Office details
[0:40] Upload proof document (IPFS)
[0:50] Transaction confirmation in Phantom
[1:00] Asset created! Show confirmation
[1:10] Switch to Admin panel
[1:20] Verify the asset
[1:30] Show verification in Phantom
[1:40] Switch to Marketplace - asset now visible
[1:50] Create fractions (2500/5000)
[2:00] Show fractions in asset details
[2:10] Go to Trade Fractions, show buying interface
[2:20] Simulate income collection
[2:30] Distribute income to fraction holders
[2:40] Back to Dashboard showing updated portfolio
[2:50] Summary: "5 major features all working together"
[3:00] "ProofRent enables fractional real-world assets on blockchain"
```

---

## Conclusion

You've successfully:
- ✅ Created a real-world asset
- ✅ Verified its authenticity with IPFS
- ✅ Created fractional ownership
- ✅ Managed secondary market
- ✅ Collected and distributed income
- ✅ Tracked portfolio value

**This is the future of real estate and asset management!**

---

**Demo Date**: April 7, 2026  
**Network**: Solana Devnet  
**Program**: ProofRent v2.0
