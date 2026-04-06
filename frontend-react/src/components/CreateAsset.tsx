import { useState, useEffect } from "react";
import { useProgram } from "../hooks/useProgram";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
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

    // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ ВВОДА ---
    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [myAssets, setMyAssets] = useState<any[]>([]); // Список ассетов из БЧ

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>("");


    // --- ФУНКЦИЯ ЗАГРУЗКИ АССЕТОВ ---
    const fetchAssets = async () => {
        if (!program) return;
        try {
            // Убираем фильтры полностью, чтобы увидеть вообще все ассеты программы
            const assetAccount = (program.account as any).asset || (program.account as any).Asset;
            const fetchedAssets = await assetAccount.all();

            console.log("Found assets:", fetchedAssets);
            setMyAssets(fetchedAssets);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    // Загружаем при старте или смене кошелька
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

            // Используем значения из инпутов: name и price
            await program.methods
                .initializeAsset(name, new anchor.BN(price))
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
            setName(""); // Очистка формы
            setPrice(0);
            fetchAssets(); // Обновляем список сразу после создания
        } catch (err) {
            // Твой улучшенный обработчик ошибок
            setMessage(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Форма создания */}
            <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 text-white text-left">Mint New Property</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Property Name</label>
                        <input
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="e.g. Skyline Apartments"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price (SOL)</label>
                        <input
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            type="number"
                            value={price}
                            onChange={e => setPrice(Number(e.target.value))}
                        />
                    </div>
                    <button
                        className="md:col-span-2 mt-4 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        {loading ? "Confirming transaction..." : "Create Asset on Blockchain"}
                    </button>
                </div>

                {message && (
                    <div className={`mt-6 p-4 rounded-xl text-sm ${message.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {message}
                    </div>
                )}
            </section>

            {/* Список ассетов */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold italic text-white text-left">Dashboard: My Portfolio</h3>
                    <span className="bg-blue-500/10 text-blue-400 px-4 py-1 rounded-full text-sm font-mono border border-blue-500/20">
                        {myAssets.length} Assets
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {myAssets.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 hover:bg-slate-800 border border-slate-800 p-6 rounded-2xl transition-all group gap-4">
                            <div className="flex items-center gap-5 text-left">
                                <div className="text-3xl bg-slate-800 p-3 rounded-xl group-hover:scale-110 transition-transform">🏠</div>
                                <div>
                                    <h4 className="font-bold text-xl text-white tracking-tight">{item.account.name}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">ID: {item.publicKey.toBase58().slice(0, 8)}...</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <p className="text-2xl font-black text-blue-400 leading-none">{item.account.price.toString()} SOL</p>
                                    <span className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter text-right block">per day</span>
                                </div>

                                {/* Новая кнопка аренды */}
                                <button
                                    onClick={() => alert(`Аренда ${item.account.name} скоро будет доступна!`)}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                                >
                                    Rent Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

}