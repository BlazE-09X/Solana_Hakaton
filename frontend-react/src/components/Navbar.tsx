import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
    return (
        <div className="flex justify-between items-center p-4 bg-black text-white">
            <h1 className="text-xl font-bold">ProofRent</h1>
            <WalletMultiButton />
        </div>
    );
}