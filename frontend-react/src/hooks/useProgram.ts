import { useMemo } from "react";
import { Program, AnchorProvider, web3, type Idl } from "@coral-xyz/anchor";
import { useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../../../target/idl/bbm.json";


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


        return new Program(idl as Idl, provider);

    }, [connection, wallet]);
}