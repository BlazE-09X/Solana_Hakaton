import { useState } from "react";
import { getBalance, getTokenBalance } from "./solana";
import { buyToken } from "./api";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [status, setStatus] = useState<string>("");

  const connectWallet = async () => {
    const { solana } = window as any;

    if (solana && solana.isPhantom) {
      const res = await solana.connect();
      setWallet(res.publicKey);

      const solBal = await getBalance(res.publicKey);
      setBalance(solBal);

      const tokenBal = await getTokenBalance(res.publicKey);
      setTokenBalance(tokenBal);
    } else {
      alert("Install Phantom Wallet");
    }
  };

  const handleBuy = async () => {
    setStatus("⏳ Processing...");
    try {
      await buyToken();
      setStatus("✅ Success!");

      const tokenBal = await getTokenBalance(wallet);
      setTokenBalance(tokenBal);
    } catch {
      setStatus("❌ Error");
    }
  };

  return (
    <div className="app">
      <div className="card">
        <h1>🏠 ProofRent</h1>
        <p className="subtitle">Fractional Property Ownership</p>

        {!wallet ? (
          <button className="primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <>
            <div className="info">
              <p><strong>Wallet:</strong></p>
              <p className="address">{wallet.toString()}</p>

              <p><strong>SOL Balance:</strong> {balance}</p>
              <p><strong>Property Tokens:</strong> {tokenBalance}</p>
            </div>

            <button className="buy" onClick={handleBuy}>
              Buy Property Token
            </button>

            <p className="status">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;