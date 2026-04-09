import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";

// ─── APP SETUP ───────────────────────────────────────────────────────────────

const app = express();

// 1. CORS — разрешаем запросы с любого источника (для девнета — ок)
app.use(cors());

// 2. JSON-парсер для обычных запросов без файлов
app.use(express.json());

// 3. Публичная раздача загруженных файлов по URL /uploads/имя_файла
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── MULTER (загрузка файлов) ─────────────────────────────────────────────────

// Создаём папку uploads если её нет
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Сохраняем файл с оригинальным именем, добавляем timestamp для уникальности
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`),
});

// ВАЖНО: поле называется "proof" — точно как во фронтенде:
//   formData.append('proof', proofFile)
//   и upload.single("proof") ниже
const upload = multer({ storage });

// ─── SOLANA CONNECTION ────────────────────────────────────────────────────────

const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
});

// ─── ТИПЫ ─────────────────────────────────────────────────────────────────────

interface AssetData {
  address: string;
  name: string;
  type: string;
  price: number;
  owner: string;
  isVerified: boolean;
  isRented?: boolean;
  renter?: string;
  totalFractions: number;
  soldFractions: number;
  ipfsProofHash: string;
  metadataUri?: string;
  txSignature?: string;
  proofFile?: string; // путь/имя сохранённого файла
  createdAt: number;
  rating: number;
  collectedIncome: number;
}

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────

const assetsStore = new Map<string, AssetData>();

// ─── SEED DEMO ASSETS ─────────────────────────────────────────────────────────

function seedDemoAssets() {
  const demoAssets: AssetData[] = [
    {
      address: "7xKp3mRjZ3kb1fUoQ7mN4q",
      name: "Manhattan Apt 4B",
      type: "Real Estate",
      price: 320000,
      owner: "DemoOwner1",
      isVerified: true,
      isRented: false,
      totalFractions: 1000,
      soldFractions: 680,
      ipfsProofHash: "demo_ipfs_hash_1",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      rating: 4.8,
      collectedIncome: 3200,
    },
    {
      address: "3aYrPjQ8zM2x4nfL1X9b",
      name: "Solar Farm Block 7",
      type: "Energy",
      price: 220000,
      owner: "DemoOwner2",
      isVerified: true,
      isRented: false,
      totalFractions: 1000,
      soldFractions: 450,
      ipfsProofHash: "demo_ipfs_hash_2",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
      rating: 4.6,
      collectedIncome: 1140,
    },
    {
      address: "9cXmT8L2w8Bh3pF4qN1v",
      name: "Corp Bond Series A",
      type: "Bond",
      price: 150000,
      owner: "DemoOwner3",
      isVerified: false,
      isRented: false,
      totalFractions: 1000,
      soldFractions: 200,
      ipfsProofHash: "demo_ipfs_hash_3",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 21,
      rating: 3.9,
      collectedIncome: 0,
    },
    {
      address: "4bNkQtS9pH2x6fL3mV8y",
      name: "Berlin Warehouse",
      type: "Real Estate",
      price: 280000,
      owner: "DemoOwner4",
      isVerified: true,
      isRented: false,
      totalFractions: 1000,
      soldFractions: 800,
      ipfsProofHash: "demo_ipfs_hash_4",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      rating: 4.9,
      collectedIncome: 1000,
    },
    {
      address: "6dPjKu3eN8yT5mW4bF7s",
      name: "Commodity Parcel 12",
      type: "Commodity",
      price: 95000,
      owner: "DemoOwner5",
      isVerified: false,
      isRented: false,
      totalFractions: 1000,
      soldFractions: 100,
      ipfsProofHash: "demo_ipfs_hash_5",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      rating: 4.1,
      collectedIncome: 0,
    },
  ];

  demoAssets.forEach((a) => assetsStore.set(a.address, a));
  console.log(`Seeded ${demoAssets.length} demo assets`);
}

seedDemoAssets();

// ─── MOCK IPFS UPLOAD ─────────────────────────────────────────────────────────

async function uploadToIPFS(_file: { name: string; data?: Buffer }): Promise<string> {
  const hash = `ipfs_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log(`[IPFS mock] Uploaded: ${hash}`);
  return hash;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HEALTH ──────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", port: process.env.PORT || 3006 });
});

// ─── GET ALL ASSETS ───────────────────────────────────────────────────────────
// Фронтенд ожидает массив: fetchAssets() → Array.isArray(data) ? data : data.assets
// Отдаём просто массив — без лишней обёртки.

app.get("/api/assets", (_req: Request, res: Response) => {
  const assets = Array.from(assetsStore.values());
  res.json(assets);
});

// ─── GET SINGLE ASSET ─────────────────────────────────────────────────────────

app.get("/api/assets/:address", (req: Request, res: Response) => {
const asset = assetsStore.get(req.params.address as string);
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
});

app.get("/api/assets/:address/details", (req: Request, res: Response) => {
  const asset = assetsStore.get(req.params.address as string);
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  res.json({
    ...asset,
    fractionHolders: [
      { address: "7xKp3mRj...mN4q", fractions: 150, percentage: 15 },
      { address: "3aYr...pQ8z", fractions: 200, percentage: 20 },
      { address: "9cXm...tL2w", fractions: 100, percentage: 10 },
    ],
    totalValue: asset.price * (asset.soldFractions / asset.totalFractions),
  });
});

// ─── CREATE ASSET (алиас фронтенда) ─────────────────────────────────────────
//
// Фронтенд шлёт ЛИБО FormData (с файлом), ЛИБО JSON (без файла).
// Multer обрабатывает multipart; для JSON — просто req.body.
//
// Поле файла: "proof"  (formData.append('proof', file))
// upload.single("proof") — обязательно совпадает с именем поля!

app.post(
  "/api/create-asset",
  upload.single("proof"),           // ← "proof" совпадает с фронтендом
  async (req: Request, res: Response) => {
    try {
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

      if (!name || !type || !price) {
        return res
          .status(400)
          .json({ error: "Missing required fields: name, type, price" });
      }

      // Если файл был загружен — логируем и берём имя
      let proofFileName: string | undefined;
      let finalIpfsHash = ipfsProofHash || `ipfs_${Date.now()}`;

      if (req.file) {
        proofFileName = req.file.filename;
        console.log(
          `[upload] File saved: ${proofFileName} (${req.file.size} bytes)`
        );
        // Мокаем IPFS-загрузку
        finalIpfsHash = await uploadToIPFS({ name: req.file.originalname });
      }

      const assetKeypair = Keypair.generate();

      const assetData: AssetData = {
        address: assetKeypair.publicKey.toBase58(),
        name,
        type,
        price: Number(price),
        owner: ownerAddress || "unknown",
        isVerified: false,
        isRented: false,
        totalFractions: Number(totalFractions) || 1000,
        soldFractions: 0,
        ipfsProofHash: finalIpfsHash,
        metadataUri: metadataUri || "",
        txSignature: txSignature || "",
        proofFile: proofFileName,
        createdAt: Date.now(),
        rating: 0,
        collectedIncome: 0,
      };

      assetsStore.set(assetData.address, assetData);
      console.log(`[asset] Created: "${assetData.name}" (${assetData.address})`);

      res.json({
        success: true,
        txId: txSignature || `tx_${Date.now()}`,
        asset: assetData,
      });
    } catch (error) {
      console.error("[create-asset] Error:", error);
      res.status(500).json({ error: String(error) });
    }
  }
);

// ─── CREATE ASSET (оригинальный эндпоинт со строгой проверкой SOL) ────────────

app.post(
  "/api/assets/create",
  upload.single("proof"),
  async (req: Request, res: Response) => {
    try {
      const { name, price, totalFractions, walletAddress, type } = req.body;
      const proofFile = req.file;

      if (!name || !price || !totalFractions || !proofFile || !walletAddress || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Проверяем баланс кошелька
      let userPubkey: PublicKey;
      try {
        userPubkey = new PublicKey(walletAddress);
      } catch {
        return res.status(400).json({ error: "Invalid wallet address" });
      }

      const balance = await connection.getBalance(userPubkey);
      const requiredSol = 0.1;
      if (balance < requiredSol * LAMPORTS_PER_SOL) {
        return res.status(400).json({
          error: `Insufficient SOL. Need ≥ ${requiredSol} SOL, have ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
        });
      }

      const proofBuffer = fs.readFileSync(proofFile.path);
      const ipfsHash = await uploadToIPFS({
        name: proofFile.originalname,
        data: proofBuffer,
      });

      const assetKeypair = Keypair.generate();

      const assetData: AssetData = {
        address: assetKeypair.publicKey.toBase58(),
        name,
        type,
        price: Number(price),
        owner: walletAddress,
        isVerified: false,
        isRented: false,
        totalFractions: Number(totalFractions),
        soldFractions: 0,
        ipfsProofHash: ipfsHash,
        proofFile: proofFile.filename,
        createdAt: Date.now(),
        rating: 0,
        collectedIncome: 0,
      };

      assetsStore.set(assetData.address, assetData);

      // Файл уже сохранён multer'ом с нужным именем, удалять не нужно
      // (он лежит в /uploads и раздаётся статически)
      console.log(`[asset/create] Created: "${assetData.name}" (${assetData.address})`);

      res.json({
        success: true,
        asset: assetData,
        incomePool: Keypair.generate().publicKey.toBase58(),
        ipfsProofHash: ipfsHash,
      });
    } catch (error) {
      console.error("[assets/create] Error:", error);
      res.status(500).json({ error: String(error) });
    }
  }
);

// ─── RENT ASSET ──────────────────────────────────────────────────────────────

app.post("/api/rent-asset", async (req: Request, res: Response) => {
  try {
    const { assetAddress, renterAddress } = req.body;

    if (!assetAddress || !renterAddress) {
      return res
        .status(400)
        .json({ error: "Missing assetAddress or renterAddress" });
    }

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    if (!asset.isVerified)
      return res.status(400).json({ error: "Asset is not verified yet" });
    if (asset.isRented)
      return res.status(400).json({ error: "Asset is already rented" });
    if (asset.owner === renterAddress)
      return res.status(400).json({ error: "Owner cannot rent their own asset" });

    asset.isRented = true;
    asset.renter = renterAddress;

    console.log(`[rent] "${asset.name}" rented by ${renterAddress}`);

    res.json({ success: true, txId: `rent_tx_${Date.now()}` });
  } catch (error) {
    console.error("[rent-asset] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── RELEASE ASSET ───────────────────────────────────────────────────────────

app.post("/api/release-asset", async (req: Request, res: Response) => {
  try {
    const { assetAddress, ownerAddress } = req.body;

    if (!assetAddress || !ownerAddress) {
      return res
        .status(400)
        .json({ error: "Missing assetAddress or ownerAddress" });
    }

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    if (asset.owner !== ownerAddress)
      return res
        .status(403)
        .json({ error: "Only the owner can release this asset" });

    asset.isRented = false;
    asset.renter = undefined;

    console.log(`[release] "${asset.name}" released`);

    res.json({ success: true, txId: `release_tx_${Date.now()}` });
  } catch (error) {
    console.error("[release-asset] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── VERIFY ASSET (GET — oracle) ──────────────────────────────────────────────

app.get("/verify", (req: Request, res: Response) => {
  try {
    const assetAddress = req.query.asset as string;
    if (!assetAddress)
      return res.status(400).json({ error: "Missing ?asset= param" });

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    asset.isVerified = true;
    console.log(`[oracle] Verified: "${asset.name}"`);

    res.json({ success: true, txId: `verify_tx_${Date.now()}` });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ─── VERIFY ASSET (POST) ──────────────────────────────────────────────────────

app.post("/api/assets/verify", (req: Request, res: Response) => {
  try {
    const { assetAddress, walletAddress } = req.body;
    if (!assetAddress || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    if (asset.owner === walletAddress) {
      return res
        .status(403)
        .json({ error: "Owner cannot verify their own asset" });
    }

    asset.isVerified = true;
    res.json({ success: true, verified: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ─── MINT FRACTIONS ───────────────────────────────────────────────────────────

app.post("/api/assets/mint-fractions", async (req: Request, res: Response) => {
  try {
    const { assetAddress, amount, walletAddress } = req.body;

    if (!assetAddress || !amount || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const balance = await connection.getBalance(userPubkey);
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      return res.status(400).json({ error: "Insufficient SOL for fees" });
    }

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    asset.soldFractions = Math.min(
      asset.soldFractions + Number(amount),
      asset.totalFractions
    );

    res.json({
      success: true,
      txId: `tx_${Date.now()}`,
      fractionsMinted: asset.soldFractions,
    });
  } catch (error) {
    console.error("[mint-fractions] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── COLLECT INCOME ───────────────────────────────────────────────────────────

app.post("/api/assets/collect-income", async (req: Request, res: Response) => {
  try {
    const { assetAddress, amount, walletAddress } = req.body;

    if (!assetAddress || !amount || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    if (asset.owner !== walletAddress) {
      return res
        .status(403)
        .json({ error: "Only asset owner can collect income" });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const balance = await connection.getBalance(userPubkey);
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      return res.status(400).json({ error: "Insufficient SOL for fees" });
    }

    asset.collectedIncome += Number(amount);

    res.json({
      success: true,
      txId: `income_tx_${Date.now()}`,
      collectedIncome: asset.collectedIncome,
    });
  } catch (error) {
    console.error("[collect-income] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── DISTRIBUTE INCOME ────────────────────────────────────────────────────────

app.post("/api/distribute-income", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const balance = await connection.getBalance(userPubkey);
    if (balance < 0.05 * LAMPORTS_PER_SOL) {
      return res
        .status(400)
        .json({ error: "Insufficient SOL for distribution" });
    }

    res.json({
      success: true,
      txId: `dist_tx_${Date.now()}`,
      totalDistributed: 1200,
      message: "Income distributed to all fraction holders",
    });
  } catch (error) {
    console.error("[distribute-income] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── RATE ASSET ───────────────────────────────────────────────────────────────

app.post("/api/assets/rate", (req: Request, res: Response) => {
  try {
    const { assetAddress, rating, walletAddress } = req.body;
    if (!assetAddress || rating === undefined || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const asset = assetsStore.get(assetAddress);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    asset.rating = (asset.rating + Number(rating)) / 2;
    res.json({ success: true, newRating: asset.rating });
  } catch (error) {
    console.error("[rate] Error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

app.get("/api/portfolio/:walletAddress", (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  const assets = Array.from(assetsStore.values()).filter(
    (a) => a.owner === walletAddress
  );
  res.json(assets);
});

// ─── MARKETPLACE (только верифицированные) ────────────────────────────────────

app.get("/api/marketplace", (_req: Request, res: Response) => {
  const assets = Array.from(assetsStore.values()).filter((a) => a.isVerified);
  res.json(assets);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SERVER START — перебираем порты, если 3006 занят
// ═══════════════════════════════════════════════════════════════════════════════

const portsToTry = [3006, 3007, 3008, 3009, 3010, 3011, 3012];

async function listenOnAvailablePort() {
  for (const port of portsToTry) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`\n✅ ProofRent Backend running on http://localhost:${port}`);
          console.log(`   /health              — статус`);
          console.log(`   /api/assets          — все ассеты (массив)`);
          console.log(`   /api/create-asset    — создать ассет (JSON или FormData)`);
          console.log(`   /api/rent-asset      — арендовать`);
          console.log(`   /api/release-asset   — освободить`);
          console.log(`   /verify?asset=...    — верифицировать (oracle)`);
          console.log(`   /uploads/...         — статические файлы\n`);
          resolve();
        });
        server.on("error", reject);
      });
      return; // успешно запустились — выходим
    } catch (error: any) {
      if (error.code === "EADDRINUSE") {
        console.warn(`Port ${port} is in use, trying next...`);
        continue;
      }
      console.error(`Failed to bind port ${port}:`, error);
      process.exit(1);
    }
  }
  console.error("No available port found. Exiting.");
  process.exit(1);
}

listenOnAvailablePort();