import { useState } from "react";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState(false);

  const connectWallet = async () => {
    const { solana } = window as any;

    if (solana && solana.isPhantom) {
      const res = await solana.connect();
      setWallet(res.publicKey.toString());
    } else {
      alert("Install Phantom");
    }
  };

  const verify = async () => {
  setStatus("🔍 Verifying...");

  const res = await fetch("http://localhost:3000/verify");
  const data = await res.json();

  if (data.success) {
    setVerified(true);
    setStatus("✅ Verified ON-CHAIN");
  }
};

  const buy = async () => {
    setStatus("⏳ Buying...");
    await fetch("http://localhost:3000/buy");
    setStatus("✅ Tokens received");
  };

  return (
    <div className="app">
      <div className="card">
        <h1>🏠 ProofRent</h1>

        {!wallet ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <>
            <p>Wallet: {wallet}</p>

            <button onClick={verify}>Verify Property</button>
            <p>{verified ? "Verified ✅" : "Not Verified ❌"}</p>

            <button onClick={buy}>Buy Token</button>
            

            <p>{status}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;