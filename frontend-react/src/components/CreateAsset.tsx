import { useState } from "react";
import { useProgram } from "../hooks/useProgram";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";

export default function CreateAsset() {
    const program = useProgram();
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");

    const handleCreate = async () => {
        if (!program || !wallet.publicKey) return;
        setLoading(true);

        try {
            const asset = Keypair.generate();

            // 1. Создаем mint
            const mint = await createMint(
                connection,
                wallet as any,
                wallet.publicKey,
                null,
                0
            );

            // 2. Создаем токен-аккаунт
            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                wallet as any,
                mint,
                wallet.publicKey
            );

            // 3. Вызов метода контракта
            await program.methods
                .initializeAsset("Test Asset", new anchor.BN(100))
                .accounts({
                    asset: asset.publicKey,
                    user: wallet.publicKey,
                    mint: mint,
                    userTokenAccount: userTokenAccount.address,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                })
                .signers([asset])
                .rpc();

            setMessage("✅ Asset created successfully!");
        } catch (err) {
            console.error(err);
            setMessage("❌ Error creating asset");
        }

        setLoading(false);
    };

    return (
        <div className="p-4 bg-gray-800 text-white rounded-xl shadow-lg space-y-2">
            <button
                className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                onClick={handleCreate}
                disabled={loading}
            >
                {loading ? "Creating..." : "Create Asset"}
            </button>
            {message && <p>{message}</p>}
        </div>
    );
}