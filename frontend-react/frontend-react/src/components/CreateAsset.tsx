import { useState, useEffect } from "react";
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

    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [myAssets, setMyAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");

    const fetchAssets = async () => {
        if (!program) return;
        try {
            const assetAccount = (program.account as any).asset || (program.account as any).Asset;
            const fetchedAssets = await assetAccount.all();
            setMyAssets(fetchedAssets);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [program, wallet.publicKey]);

    const handleCreate = async () => {
        if (!program || !wallet.publicKey || !wallet.sendTransaction) return;
        if (!name) { setMessage("⚠️ Enter asset name"); return; }
        setLoading(true);
        setMessage("⏳ Processing...");
        try {
            const assetKeypair = Keypair.generate();
            const mintKeypair = Keypair.generate();
            const userTokenAccount = getAssociatedTokenAddressSync(mintKeypair.publicKey, wallet.publicKey);
            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMintInstruction(mintKeypair.publicKey, 0, wallet.publicKey, wallet.publicKey),
                createAssociatedTokenAccountInstruction(wallet.publicKey, userTokenAccount, wallet.publicKey, mintKeypair.publicKey)
            );

            await wallet.sendTransaction(transaction, connection, { signers: [mintKeypair] });

            await program.methods
                .initializeAsset(name, new anchor.BN(price), "")
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
            setName("");
            setPrice(0);
            fetchAssets();
        } catch (err) {
            setMessage(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRent = async (assetAddress: PublicKey, ownerAddress: PublicKey) => {
        if (!program || !wallet.publicKey) return;
        setLoading(true);
        setMessage("⏳ Renting asset...");
        try {
            await program.methods.rentAsset().accounts({
                asset: assetAddress,
                renter: wallet.publicKey,
                owner: ownerAddress,
                systemProgram: SystemProgram.programId,
            }).rpc();
            setMessage("✅ Asset rented!");
            fetchAssets();
        } catch (err: any) {
            setMessage(`❌ Rent error: ${err.message}`);
        } finally { setLoading(false); }
    };

    const handleRelease = async (assetAddress: PublicKey) => {
        if (!program || !wallet.publicKey) return;
        setLoading(true);
        setMessage("⏳ Releasing asset...");
        try {
            await program.methods.releaseAsset().accounts({
                asset: assetAddress,
                owner: wallet.publicKey,
            }).rpc();
            setMessage("✅ Asset is now available!");
            fetchAssets();
        } catch (err: any) {
            setMessage(`❌ Release error: ${err.message}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-8">
            <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 text-white text-left">Mint New Property</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    <input className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white" type="number" placeholder="Price (SOL)" value={price} onChange={e => setPrice(Number(e.target.value))} />
                    <button className="md:col-span-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold" onClick={handleCreate} disabled={loading}>
                        {loading ? "Processing..." : "Create Asset"}
                    </button>
                </div>
                {message && <div className="mt-4 p-4 bg-slate-800 rounded-xl text-blue-400">{message}</div>}
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-6">Portfolio</h3>
                <div className="grid grid-cols-1 gap-4">
                    {myAssets.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <div className="text-left">
                                <h4 className="font-bold text-white text-lg">{item.account.name}</h4>
                                <p className="text-blue-400 font-black">{item.account.price.toString()} SOL</p>
                            </div>
                            <div className="flex gap-2">
                                {item.account.isRented ? (
                                    wallet.publicKey?.toBase58() === item.account.owner.toBase58() ? (
                                        <button onClick={() => handleRelease(item.publicKey)} className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold">Release</button>
                                    ) : (
                                        <span className="px-6 py-2 bg-slate-700 text-slate-400 rounded-lg font-bold">Rented</span>
                                    )
                                ) : (
                                    <button onClick={() => handleRent(item.publicKey, item.account.owner)} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">Rent Now</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}