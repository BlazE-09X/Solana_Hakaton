import Navbar from "./components/Navbar";
import Balance from "./components/Balance";
import CreateAsset from "./components/CreateAsset";

export default function App() {
    return (
        <div className="min-h-screen bg-gray-950">
            <Navbar />

            <div className="p-6 space-y-6">
                <Balance />
                <CreateAsset />
            </div>
        </div>
    );
}