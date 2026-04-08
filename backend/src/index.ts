import express from "express";
import "dotenv/config";
import cors from "cors";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const app = express();
app.use(cors());
app.use(express.json());

interface AssetRecord {
  address: string;
  name: string;
  type: string;
  price: number;
  metadataUri: string;
  owner: string;
  txSignature: string;
  ipfsProofHash?: string;
  totalFractions?: number;
  isVerified: boolean;
  isRented: boolean;
  renter?: string;
}

const assets: AssetRecord[] = [];

// 🔗 Anchor provider
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// Фикс типизации: провайдер в Node.js использует NodeWallet, у которого есть свойство payer
const nodeWallet = provider.wallet as anchor.Wallet & { payer: Keypair };

// @ts-ignore: фикс deep type errors
const program = anchor.workspace.Bbm as anchor.Program<any>;

console.log("Program ID:", program.programId.toBase58());

// 🔮 VERIFY → создаем Asset и SPL токен
app.get("/verify", async (req, res) => {
  try {
    // генерируем новый Asset (аккаунт данных в программе)
    const asset: anchor.web3.Signer = Keypair.generate();

    // создаём SPL токен (минт) для этого Asset
    const mint = await createMint(
      provider.connection,
      nodeWallet.payer,          // ИСПОЛЬЗУЕМ nodeWallet.payer
      nodeWallet.publicKey,      // authority
      null,                      // freeze authority
      0                          // decimals
    );

    // инициализируем Asset on-chain
    // @ts-ignore
    await program.methods
      .initializeAsset("Astana Apartment", new anchor.BN(100000), mint)
      .accounts({
        asset: asset.publicKey,
        user: nodeWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([asset])
      .rpc();

    // верификация
    // @ts-ignore
    await program.methods
      .verifyAsset()
      .accounts({
        asset: asset.publicKey,
      })
      .rpc();

    res.json({
      success: true,
      asset: asset.publicKey.toBase58(),
      mint: mint.toBase58(),
    });
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ error: "Error verifying asset", details: err });
  }
});

// 💰 BUY → mint токен пользователю
app.get("/buy/:mint", async (req, res) => {
  try {
    const mint = new PublicKey(req.params.mint);

    // Создаем или получаем ATA (Associated Token Account) для нашего же кошелька (сервера)
    // В реальном приложении здесь должен быть адрес кошелька покупателя
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      nodeWallet.payer,          // платит за транзакцию
      mint,
      nodeWallet.publicKey       // владелец аккаунта (куда придут токены)
    );

    await mintTo(
      provider.connection,
      nodeWallet.payer,          // платит за транзакцию
      mint,
      userTokenAccount.address,
      nodeWallet.payer,          // authority (тот, кто имеет право минтить)
      1 
    );

    res.json({
      success: true,
      message: "Token minted for asset",
      account: userTokenAccount.address.toBase58(),
    });
  } catch (err) {
    console.error("Buy Error:", err);
    res.status(500).json({ error: "Error buying token", details: err });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/assets', (req, res) => {
  res.json(assets);
});

app.post('/api/create-asset', (req, res) => {
  const {
    name,
    type,
    price,
    metadataUri,
    ownerAddress,
    txSignature,
    ipfsProofHash,
    totalFractions,
  } = req.body;

  if (!name || !type || !price || !metadataUri || !ownerAddress || !txSignature) {
    return res.status(400).json({ error: 'Missing required asset fields' });
  }

  const newAsset: AssetRecord = {
    address: txSignature,
    name,
    type,
    price,
    metadataUri,
    owner: ownerAddress,
    txSignature,
    ipfsProofHash,
    totalFractions,
    isVerified: false,
    isRented: false,
  };

  assets.push(newAsset);
  res.json({ success: true, asset: newAsset });
});

app.post('/api/verify', (req, res) => {
  const { assetAddress } = req.body;
  const asset = assets.find((a) => a.address === assetAddress || a.txSignature === assetAddress);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  asset.isVerified = true;
  res.json({ success: true, asset });
});

app.post('/api/rent', (req, res) => {
  const { assetAddress, renterAddress } = req.body;
  const asset = assets.find((a) => a.address === assetAddress || a.txSignature === assetAddress);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  if (asset.isRented) return res.status(400).json({ error: 'Asset is already rented' });
  asset.isRented = true;
  asset.renter = renterAddress;
  res.json({ success: true, asset });
});

app.post('/api/release', (req, res) => {
  const { assetAddress, ownerAddress } = req.body;
  const asset = assets.find((a) => a.address === assetAddress || a.txSignature === assetAddress);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  if (asset.owner !== ownerAddress) return res.status(403).json({ error: 'Only owner can release asset' });
  asset.isRented = false;
  asset.renter = undefined;
  res.json({ success: true, asset });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));