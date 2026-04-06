import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
/// <reference types="mocha" />
//import { Bbm } from "../target/idl/bbm.json";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

describe("bbm", () => {
    // Конфигурируем провайдера
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Bbm as Program;

    // Хаки для получения доступа к payer, так как TS ругается на тип Wallet
    const wallet = provider.wallet as anchor.Wallet;

    it("Initialize Asset", async () => {
        const asset = Keypair.generate();

        // 1. Создаём mint (токен)
        const mint = await createMint(
            provider.connection,
            wallet.payer,           // Теперь TS видит payer
            wallet.publicKey,
            null,
            0
        );

        // 2. Создаём ассоциированный токен-аккаунт (ATA)
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            wallet.payer,
            mint,
            wallet.publicKey
        );

        // 3. Вызываем инструкцию контракта
        try {
            await program.methods
                .initializeAsset("Test Asset", new anchor.BN(100))
                .accounts({
                    asset: asset.publicKey,
                    user: wallet.publicKey,
                    mint: mint,
                    userTokenAccount: userTokenAccount.address,
                    // ВАЖНО: Добавляем tokenProgram, она нужна для CPI в Rust
                    tokenProgram: TOKEN_PROGRAM_ID,
                    // Эти два поля можно попробовать удалить, если билд IDL прошел успешно,
                    // так как Anchor часто подставляет их сам. Но оставим для надежности:
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                } as any) // Используем 'as any' если IDL еще капризничает по именам
                .signers([asset])
                .rpc();

            console.log("✅ Asset initialized!");
        } catch (err) {
            console.error("❌ Error initializing asset:", err);
            throw err;
        }
    });
});