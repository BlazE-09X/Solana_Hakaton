import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import fs from "fs";

//Настройки
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Загрузка ключей
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("./user.json", "utf8")))
);

const recipientPubkey = new PublicKey("FGkSbsLkiwhwgDJGjaNd8Z4YHCFD6YheBkTV1BMsQnkq"); 
const mintPubkey = new PublicKey("BvtayRG1XeXNbLEjX324TQPFy3JuaJVRYWrqHiuuaoeC"); // mint токена
const amount = 10; // количество токенов для отправки

async function main() {
  try {
    // Создаем token account отправителя
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPubkey,
      payer.publicKey
    );

    // Получаем token account получателя
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPubkey,
      recipientPubkey
    );

    // Перевод токенов
    const signature = await transfer(
      connection,
      payer,
      senderTokenAccount.address,
      recipientTokenAccount.address,
      payer.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );

    console.log("Транзакция успешна!");
    console.log("Signature:", signature);
  } catch (err) {
    console.error("Ошибка при отправке токена:", err);
  }
}

main();