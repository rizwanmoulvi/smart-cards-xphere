import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { WalletContext } from "../context/WalletContext";
import { Wallet, Menu } from "lucide-react";
import Logo from "../assets/logo.png";

const Header = () => {
  const { walletAddress, connectWallet, network, switchNetwork } =
    useContext(WalletContext);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (network === "XPhere-Testnet") {
      setIsCorrectNetwork(true);
    } else {
      setIsCorrectNetwork(false);
    }
  }, [network]);

  return (
    <nav className="px-4 md:px-24 h-20 md:h-24 flex items-center justify-between bg-white/5 backdrop-blur-lg border-b border-white/10">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="relative w-8 h-8 md:w-14 md:h-14 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-md md:rounded-xl md:p-2 transition-all duration-300 group-hover:scale-105">
          <img
            src={Logo}
            alt="Vibe Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-xl md:text-3xl font-bold">
          <span className="text-white">SmartCards</span>
        </h1>
      </Link>

      {walletAddress && isCorrectNetwork && (
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-white hover:text-pink-500 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/create-card" 
            className="text-white hover:text-pink-500 transition-colors"
          >
            Create Card
          </Link>
          <Link 
            to="/manage-cards" 
            className="text-white hover:text-pink-500 transition-colors"
          >
            Manage Cards
          </Link>
          <Link 
            to="/spend" 
            className="text-white hover:text-pink-500 transition-colors"
          >
            Spend
          </Link>
          <Link 
            to="/history" 
            className="text-white hover:text-pink-500 transition-colors"
          >
            History
          </Link>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!walletAddress ? (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-300"
          >
            <Wallet size={20} />
            Connect Wallet
          </button>
        ) : !isCorrectNetwork ? (
          <button
            onClick={switchNetwork}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-300"
          >
            Switch Network
          </button>
        ) : (
          <div className="px-4 py-2 bg-white/10 rounded-xl text-white">
            {truncateAddress(walletAddress)}
          </div>
        )}

        <button
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && walletAddress && isCorrectNetwork && (
        <div className="md:hidden absolute top-20 right-4 w-48 py-2 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
          <Link
            to="/"
            className="block px-4 py-2 text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/create-card"
            className="block px-4 py-2 text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            Create Card
          </Link>
          <Link
            to="/manage-cards"
            className="block px-4 py-2 text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            Manage Cards
          </Link>
          <Link
            to="/spend"
            className="block px-4 py-2 text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            Spend
          </Link>
          <Link
            to="/history"
            className="block px-4 py-2 text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            History
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;
