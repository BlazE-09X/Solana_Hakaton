import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// mint
const TOKEN_MINT = new PublicKey("BvtayRG1XeXNbLEjX324TQPFy3JuaJVRYWrqHiuuaoeC");

// SOL баланс
export const getBalance = async (publicKey: PublicKey) => {
  const balance = await connection.getBalance(publicKey);
  return balance / 1e9;
};

// SPL токены
export const getTokenBalance = async (wallet: PublicKey) => {
  const accounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    mint: TOKEN_MINT,
  });

  if (accounts.value.length === 0) return 0;

  return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
};