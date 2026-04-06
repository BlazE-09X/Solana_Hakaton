import { useState } from "react";
import { useProgram } from "../hooks/useProgram";
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import {
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";

export default function CreateAsset() {
    const program = useProgram();
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");

    const handleCreate = async () => {
        if (!program || !wallet.publicKey || !wallet.sendTransaction) {
            setMessage("❌ Wallet not connected or program not loaded");
            return;
        }

        setLoading(true);
        setMessage("⏳ Creating asset...");

        try {
            // 1. Подготовка ключей
            const assetKeypair = Keypair.generate();
            const mintKeypair = Keypair.generate();

            // Получаем адрес токен-аккаунта (ATA) заранее
            const userTokenAccount = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey
            );

            // 2. Считаем аренду для Минта
            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

            // 3. Создаем ОДНУ большую транзакцию (это дешевле и надежнее)
            const transaction = new Transaction().add(
                // Создаем аккаунт для Минта
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),
                // Инициализируем Минт
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    0, // decimals
                    wallet.publicKey, // mint authority
                    wallet.publicKey  // freeze authority
                ),
                // Создаем ATA (Associated Token Account)
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    userTokenAccount,
                    wallet.publicKey,
                    mintKeypair.publicKey
                )
            );

            // Отправляем транзакцию создания токена
            await wallet.sendTransaction(transaction, connection, {
                signers: [mintKeypair]
            });

            // 4. Теперь вызываем ваш контракт
            await program.methods
                .initializeAsset("Test Asset", new anchor.BN(100))
                .accounts({
                    asset: assetKeypair.publicKey,
                    user: wallet.publicKey,
                    mint: mintKeypair.publicKey,
                    userTokenAccount: userTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([assetKeypair])
                .rpc();

            setMessage("✅ Asset created successfully!");
        } catch (err: any) {
            console.error("Full error:", err);
            setMessage(`❌ Error: ${err.message || "Check console"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-800 text-white rounded-xl shadow-lg space-y-2">
            <h2 className="text-xl font-bold">ProofRent Manager</h2>
            <button
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50"
                onClick={handleCreate}
                disabled={loading}
            >
                {loading ? "Processing..." : "Create New Asset"}
            </button>
            {message && <p className="text-sm mt-2">{message}</p>}
        </div>
    );
}