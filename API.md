# API Documentation - ProofRent v2.0

## Base Configuration

**Base URL**: `http://localhost:3000`  
**Content-Type**: `application/json` (except multipart uploads)  
**Authentication**: Wallet signature (via Phantom)

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assets/create` | Create new asset with IPFS proof |
| POST | `/api/assets/:assetId/mint-fractions` | Mint fraction tokens |
| POST | `/api/assets/:assetId/collect-income` | Collect rental payments |
| POST | `/api/assets/:assetId/distribute-income` | Distribute to fraction holders |
| POST | `/api/assets/:assetId/rate` | Rate an asset (1-5) |
| POST | `/api/assets/:assetId/verify` | Admin: Verify asset |
| GET | `/api/assets/:assetId` | Get asset details |
| GET | `/api/marketplace` | List all assets |
| GET | `/api/portfolio/:wallet` | Get user's assets |

---

## Detailed Endpoint Documentation

### 1. CREATE ASSET

**Endpoint**: `POST /api/assets/create`

**Content-Type**: `multipart/form-data`

**Request Body**:
```json
{
  "name": "Manhattan Penthouse",
  "price": "1500",
  "totalFractions": "1500",
  "proof": <FILE>
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Asset name (50 chars max) |
| price | string | Yes | Price in SOL |
| totalFractions | string | Yes | Total fractions to create |
| proof | file | Yes | Document (PDF, JPG, PNG, DOC) |

**Success Response (200)**:
```json
{
  "success": true,
  "asset": "9C2UjvvHNkJfXnQ7VX2L9Y3mK...",
  "mainMint": "TokenMintAddress9C2Ujvv...",
  "fractionMint": "FractionTokenMint9C2U...",
  "incomePool": "IncomePoolAddress9C2...",
  "ipfsProofHash": "QmXxxxxxxxxxxxxxxxxxxx..."
}
```

**Error Response (400/500)**:
```json
{
  "error": "Missing required fields",
  "details": "...error details..."
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/assets/create \
  -F "name=Brooklyn Bridge Toll" \
  -F "price=2000" \
  -F "totalFractions=2000" \
  -F "proof=@deed.pdf"
```

---

### 2. MINT FRACTIONS

**Endpoint**: `POST /api/assets/:assetId/mint-fractions`

**Request Body**:
```json
{
  "amount": 500
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| amount | number | Yes | Number of fractions to mint |

**Notes**:
- Owner-only operation
- Cannot mint more than `totalFractions`
- Each fraction = 1 SPL token

**Success Response (200)**:
```json
{
  "success": true,
  "fractionMint": "FractionTokenMint...",
  "amountMinted": 500
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/assets/9C2Ujvv.../mint-fractions \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
```

---

### 3. COLLECT RENT INCOME

**Endpoint**: `POST /api/assets/:assetId/collect-income`

**Request Body**:
```json
{
  "amount": "50"
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| amount | string | Yes | SOL amount to collect |

**Notes**:
- Owner-only
- Asset must be marked as rented
- Funds go to IncomePool account

**Success Response (200)**:
```json
{
  "success": true,
  "assetId": "9C2Ujvv...",
  "incomeCollected": "50"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/assets/9C2Ujvv.../collect-income \
  -H "Content-Type: application/json" \
  -d '{"amount": "50"}'
```

---

### 4. DISTRIBUTE INCOME

**Endpoint**: `POST /api/assets/:assetId/distribute-income`

**Request Parameters**: None (uses asset context)

**Notes**:
- Owner-only
- Sends all pending income to fraction holders
- Distribution = (fractionsOwned / totalFractions) * totalIncome

**Success Response (200)**:
```json
{
  "success": true,
  "assetId": "9C2Ujvv...",
  "message": "Income distributed to fraction holders"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/assets/9C2Ujvv.../distribute-income
```

---

### 5. RATE ASSET

**Endpoint**: `POST /api/assets/:assetId/rate`

**Request Body**:
```json
{
  "rating": 5
}
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| rating | number | Yes | Rating 1-5 |

**Success Response (200)**:
```json
{
  "success": true,
  "assetId": "9C2Ujvv...",
  "rating": 5
}
```

**Error Response (400)**:
```json
{
  "error": "Rating must be between 1 and 5"
}
```

---

### 6. VERIFY ASSET (Admin Only)

**Endpoint**: `POST /api/assets/:assetId/verify`

**Notes**:
- Requires admin wallet
- Sets `isVerified = true`
- Makes asset visible in marketplace

**Success Response (200)**:
```json
{
  "success": true,
  "assetId": "9C2Ujvv...",
  "isVerified": true
}
```

---

### 7. GET ASSET DETAILS

**Endpoint**: `GET /api/assets/:assetId`

**Success Response (200)**:
```json
{
  "success": true,
  "asset": {
    "address": "9C2Ujvv...",
    "name": "Manhattan Penthouse",
    "price": 1500,
    "owner": "wallet_address...",
    "isVerified": true,
    "isRented": false,
    "totalFractions": 1500,
    "fractionsMinted": 500,
    "ipfsProofHash": "QmXxxx...",
    "createdAt": 1712000000,
    "rating": 5,
    "collectedIncome": 100
  }
}
```

**Example**:
```bash
curl http://localhost:3000/api/assets/9C2Ujvv...
```

---

### 8. GET MARKETPLACE

**Endpoint**: `GET /api/marketplace`

**Query Parameters**: None

**Success Response (200)**:
```json
{
  "success": true,
  "total": 5,
  "assets": [
    {
      "address": "9C2Ujvv...",
      "name": "Brooklyn Apartment",
      "price": 500,
      "owner": "owner_wallet...",
      "isVerified": true,
      "isRented": false,
      "totalFractions": 1000,
      "fractionsMinted": 500,
      "ipfsProofHash": "QmXxxx...",
      "createdAt": 1712000000,
      "rating": 4,
      "collectedIncome": 0
    },
    ...
  ]
}
```

**Filter Examples** (frontend-side filtering):
```javascript
// Verified only
assets.filter(a => a.isVerified)

// Search by name
assets.filter(a => a.name.includes(search))

// Sorted by rating
assets.sort((a, b) => b.rating - a.rating)
```

---

### 9. GET PORTFOLIO

**Endpoint**: `GET /api/portfolio/:wallet`

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| wallet | string | Yes | Wallet public key |

**Success Response (200)**:
```json
{
  "success": true,
  "wallet": "ABC123...",
  "totalAssets": 3,
  "assets": [
    {
      "address": "9C2Ujvv...",
      "name": "My Apartment",
      "price": 500,
      "owner": "ABC123...",
      "isVerified": true,
      "isRented": false,
      "totalFractions": 1000,
      "fractionsMinted": 500,
      "ipfsProofHash": "QmXxxx...",
      "createdAt": 1712000000,
      "rating": 5,
      "collectedIncome": 150
    },
    ...
  ]
}
```

**Example**:
```bash
curl http://localhost:3000/api/portfolio/ABC123wxyz...
```

---

## Response Format

**Success (200, 201)**:
```json
{
  "success": true,
  "data": {...}
}
```

**Error (400, 401, 403, 404, 500)**:
```json
{
  "error": "Human-readable error message",
  "details": "Technical details..."
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Asset/wallet doesn't exist |
| 500 | Server Error - Internal error |

---

## Authentication

All requests are tied to the connected Phantom wallet:
```javascript
// Frontend usage
const { publicKey } = useWallet();

// API calls automatically include wallet context
fetch(`/api/assets/create`, {
  method: 'POST',
  body: formData
  // publicKey is available from wallet context
})
```

---

## Rate Limiting

Currently: **Unlimited** (production should add limits)

Future implementation:
- 100 requests per minute per IP
- 1000 requests per minute per wallet

---

## CORS

Enabled for all origins in development. Configure for production:
```javascript
// backend/src/index.ts
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',')
}))
```

---

## Webhooks (Future)

Planned webhook events:
- `asset.created`
- `asset.verified`
- `income.collected`
- `income.distributed`
- `fraction.traded`

---

## Testing

**Using curl**:
```bash
# Create asset
curl -X POST http://localhost:3000/api/assets/create \
  -F "name=Test" -F "price=100" -F "totalFractions=100" -F "proof=@test.pdf"

# Get marketplace
curl http://localhost:3000/api/marketplace

# Get portfolio
curl http://localhost:3000/api/portfolio/ABC123...
```

**Using Postman**:
1. Import collection from `./postman/ProofRent.json`
2. Set environment variables (BASE_URL, WALLET_ADDRESS)
3. Run requests

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Apr 7, 2026 | Fractions, income distribution, IPFS |
| 1.0 | Mar 20, 2026 | Basic RWA tokenization |

---

**Last Updated**: April 7, 2026
