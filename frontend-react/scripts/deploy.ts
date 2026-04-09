import * as anchor from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  // Настройка провайдера
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Путь к сгенерированному IDL после сборки программы
  const idlPath = resolve(__dirname, "../target/idl/bbm.json");
  const idl = JSON.parse(readFileSync(idlPath, "utf-8"));

  // ID программы (должно совпадать с declare_id! в lib.rs)
  const programId = new anchor.web3.PublicKey("Fg6PaFpoGXkYsidMpWxTWqkZp1wqJ7Yw5h9G8K1XKz6h");

  // Создаем объект программы
  const program = new anchor.Program(idl as any, provider);

  console.log("Program deployed at:", program.programId.toBase58());
}

main()
  .then(() => console.log("Deployment finished"))
  .catch((err) => {
    console.error("Deployment error:", err);
    process.exit(1);
  });