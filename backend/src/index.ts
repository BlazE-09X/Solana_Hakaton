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

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));