import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
/// <reference types="mocha" />
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

describe("bbm", () => {
    // Настраиваем провайдера
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Bbm as Program;

    // Для доступа к payer через TS
    const wallet = provider.wallet as anchor.Wallet;

    it("Initialize Asset and Mint Tokens", async () => {
        const asset = Keypair.generate();

        // Создаем новый токен (mint)
        const mint = await createMint(
            provider.connection,
            wallet.payer,         // authority
            wallet.publicKey,     // mint authority
            null,                 // freeze authority
            0                     // decimals
        );

        // Создаем ассоциированный токен-аккаунт (ATA) пользователя
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            wallet.payer,
            mint,
            wallet.publicKey
        );

        console.log("Mint:", mint.toBase58());
        console.log("User token account:", userTokenAccount.address.toBase58());

        // Вызываем инструкцию контракта для инициализации Asset
        try {
            await program.methods
                .initializeAsset("Test Asset", new anchor.BN(100))
                .accounts({
                    asset: asset.publicKey,
                    user: wallet.publicKey,
                    mint: mint, // mint токен
                    userTokenAccount: userTokenAccount.address, // ATA
                    tokenProgram: TOKEN_PROGRAM_ID, // SPL Token program
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any) // Используем any, чтобы TS не ругался на IDL
                .signers([asset])
                .rpc();

            console.log("✅ Asset initialized and tokens ready!");
        } catch (err) {
            console.error("❌ Error initializing asset:", err);
            throw err;
        }
    });
});