# Technical Architecture

The system follows a decentralized application (dApp) pattern, removing the need for a traditional centralized backend for core logic.

### Tech Stack:
* **Frontend:** React.js + Vite (Typescript)
* **Blockchain Interaction:** @solana/web3.js & @coral-xyz/anchor
* **Smart Contracts:** Anchor Framework (Rust)
* **Network:** Solana Devnet

### System Flow:
1.  **Client-Side:** React app fetches property metadata and IDL.
2.  **Wallet Integration:** User connects via Solana Wallet Adapter (Phantom/Solflare).
3.  **Instruction Building:** Anchor Provider constructs transactions based on IDL definitions.
4.  **On-Chain Execution:** Solana validators process instructions, updating the program state and minting/transferring property tokens.
