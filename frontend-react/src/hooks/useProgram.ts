import { useMemo } from "react";
// Добавляем 'type' перед Idl
import { Program, AnchorProvider, web3, type Idl } from "@coral-xyz/anchor";
// Добавляем 'type' перед AnchorWallet
import { useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/bbm.json";

// Если вы используете Anchor 0.30+, адрес программы берется из IDL автоматически.
// Но если компилятор ругается, что переменная не используется, мы либо передаем её в Program, 
// либо удаляем, если она уже есть внутри bbm.json.
const PROGRAM_ID = new web3.PublicKey("EGW1GweVgm4BgdKZvR7a9VAJGbwmf3kQPXU71n6MQ3v5");

export function useProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    return useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            return null;
        }

        const anchorWallet = wallet as AnchorWallet;

        const provider = new AnchorProvider(
            connection,
            anchorWallet,
            { preflightCommitment: "processed" }
        );

        // Решение проблемы 'PROGRAM_ID is never read':
        // В версии 0.30+ адрес часто подтягивается из JSON (idl.address).
        // Если инициализация требует явного адреса, передаем его вторым аргументом:
        return new Program(idl as Idl, provider);

        // ПРИМЕЧАНИЕ: Если программа не видит ID, используйте: 
        // return new Program(idl as Idl, provider); 
        // В Anchor 0.30 IDL теперь содержит поле "address". 
        // Если ваша версия ниже 0.30, используйте: 
        // return new Program(idl as Idl, PROGRAM_ID, provider);
    }, [connection, wallet]);
}