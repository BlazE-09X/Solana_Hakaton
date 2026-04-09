import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";

export default function Balance() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);

    const fetchBalance = useCallback(async () => {
        if (publicKey) {
            const lamports = await connection.getBalance(publicKey);
            setBalance(lamports / 1e9);
        }
    }, [publicKey, connection]);

    useEffect(() => {
        fetchBalance();
        // Обновляем баланс каждые 10 секунд
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [fetchBalance]);

    if (!publicKey) return null;

    return (
        <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white rounded-2xl shadow-lg flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Your Balance</p>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    {balance !== null ? `${balance.toFixed(3)} SOL` : "Loading..."}
                </h2>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
            </div>
        </div>
    );
}