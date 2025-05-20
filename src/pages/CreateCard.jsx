import React, { useState, useContext } from "react";
import { ethers } from "ethers";
import { WalletContext } from "../context/WalletContext";
import abi from "../utils/abi.json";
import { Loader2, Wallet2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const contractAddress = import.meta.env.VITE_SMARTCARD_CONTRACT;

const CreateCard = () => {
  const { walletAddress, connectWallet, network } = useContext(WalletContext);
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCard = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }

    if (!limit || parseFloat(limit) <= 0) {
      toast.error("Please enter a valid spending limit");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);

      toast.loading("Creating your Smart Card...");
      const tx = await contract.createCard(ethers.utils.parseEther(limit));
      
      toast.loading("Waiting for confirmation...");
      await tx.wait();
      
      toast.success("Smart Card created successfully!");
      setLimit("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create Smart Card");
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Create Smart Card
          </h1>
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-6 py-3 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-300"
          >
            <Wallet2 size={20} />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (network !== "XPhere-Testnet") {
    return (
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Wrong Network
          </h1>
          <p className="text-white mb-8">
            Please switch to the XPhere-Testnet network to create Smart Cards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Create Smart Card
          </h1>
          <p className="text-red-200 mt-4">
            Set a spending limit for your new Smart Card
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="space-y-6">
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-white mb-2">
                Spending Limit (XPT)
              </label>
              <div className="relative">
                <input
                  id="limit"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter spending limit"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-white/50">XPT</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateCard}
              disabled={loading || !limit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet2 className="w-5 h-5" />
              )}
              {loading ? "Creating..." : "Create Smart Card"}
            </button>

            <div className="flex items-start gap-2 text-sm text-red-200/80">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Make sure to set a reasonable spending limit. You can always modify it later through the Manage Cards section.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCard;
