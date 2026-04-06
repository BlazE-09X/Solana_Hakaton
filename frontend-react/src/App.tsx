import CreateAsset from "./components/CreateAsset";
import Balance from "./components/Balance";
import Navbar from "./components/Navbar";

function App() {
    return (
        <div className="min-h-screen bg-[#020617] text-white">
            {/* 1. Навигация — здесь остается ЕДИНСТВЕННАЯ кнопка WalletMultiButton */}
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
                {/* 2. Карточка баланса — теперь без кнопки, просто инфо */}
                <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/60 backdrop-blur-sm">
                    <div className="text-left">
                        <h2 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Your Wallet Balance</h2>
                        <Balance />
                    </div>
                </div>

                {/* 3. Основной функционал */}
                <CreateAsset />
            </main>

            <footer className="py-10 text-slate-700 text-[10px] uppercase tracking-[0.3em] font-bold text-center">
                ProofRent Protocol • v1.0 Devnet
            </footer>
        </div>
    );
}

export default App;