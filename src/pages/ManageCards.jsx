import { useContext, useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { WalletContext } from "../context/WalletContext";
import abi from "../utils/abi.json";
import { Loader2, Power, RotateCcw, Wallet2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import TransactionModal from "../components/TransactionModal";

const contractAddress = import.meta.env.VITE_SMARTCARD_CONTRACT;

const ManageCards = () => {
  const { walletAddress, connectWallet, network } = useContext(WalletContext);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'deposit' or 'withdraw'
    cardId: null,
    maxAmount: null
  });
  const [amount, setAmount] = useState("");

  const fetchCards = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);

      const fetchedCards = [];
      let i = 0;
      while (true) {
        try {
          const card = await contract.getCardInfo(i);
          console.log(`Card #${i}:`, card);

          if (card.owner.toLowerCase() === walletAddress.toLowerCase()) {
            fetchedCards.push({
              id: i,
              balance: ethers.utils.formatEther(card.balance),
              spendingLimit: ethers.utils.formatEther(card.limit),
              amountSpent: ethers.utils.formatEther(card.spent),
              isActive: card.active,
            });
          }

          i++;
          if (i > 1000) break; // prevent infinite loop
        } catch (innerErr) {
          console.log(`Stopped fetching at card ID ${i}:`, innerErr.message);
          break;
        }
      }

      setCards(fetchedCards);
    } catch (err) {
      console.error("Error fetching cards:", err);
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const toggleActive = async (cardId, isActive) => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);

      const tx = await contract.setActive(cardId, !isActive);
      await toast.promise(tx.wait(), {
        loading: "Updating card status...",
        success: "Card status updated!",
        error: "Failed to update card status",
      });
      fetchCards();
    } catch (error) {
      console.error("Error toggling card status:", error);
      toast.error(error.message || "Failed to toggle card status");
    } finally {
      setLoading(false);
    }
  };

  const resetSpent = async (cardId) => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);

      const tx = await contract.resetSpent(cardId);
      await toast.promise(tx.wait(), {
        loading: "Resetting spent amount...",
        success: "Spent amount reset!",
        error: "Failed to reset spent amount",
      });
      fetchCards();
    } catch (error) {
      console.error("Error resetting spent:", error);
      toast.error(error.message || "Failed to reset spent amount");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the input amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (modalState.type === 'withdraw' && numAmount > parseFloat(modalState.maxAmount)) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);

      // Convert the amount to a string with fixed decimals to avoid scientific notation
      const amountStr = numAmount.toFixed(18);
      const amountInWei = ethers.utils.parseUnits(amountStr, 18);
      
      let tx;
      if (modalState.type === 'deposit') {
        tx = await contract.deposit(modalState.cardId, { value: amountInWei });
      } else {
        tx = await contract.withdraw(modalState.cardId, amountInWei);
      }
      
      await toast.promise(tx.wait(), {
        loading: modalState.type === 'deposit' ? "Processing deposit..." : "Processing withdrawal...",
        success: modalState.type === 'deposit' ? "Deposit successful!" : "Withdrawal successful!",
        error: modalState.type === 'deposit' ? "Failed to deposit" : "Failed to withdraw",
      });
      
      fetchCards();
      closeModal();
    } catch (error) {
      console.error(`Error ${modalState.type}ing:`, error);
      toast.error(error.message || `Failed to ${modalState.type}`);
    } finally {
      setLoading(false);
    }
  };

  const openDepositModal = (cardId) => {
    setModalState({
      isOpen: true,
      type: 'deposit',
      cardId,
      maxAmount: null
    });
    setAmount("");
  };

  const openWithdrawModal = (cardId, balance) => {
    setModalState({
      isOpen: true,
      type: 'withdraw',
      cardId,
      maxAmount: balance
    });
    setAmount(balance);
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      cardId: null,
      maxAmount: null
    });
    setAmount("");
  };

  const changeLimit = async (cardId, currentLimit) => {
    try {
      const newLimit = prompt("Enter new spending limit in XPT:", ethers.utils.formatEther(currentLimit));
      if (!newLimit) return;

      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);

      const limitInWei = ethers.utils.parseEther(newLimit);
      const tx = await contract.changeLimit(cardId, limitInWei);
      
      await toast.promise(tx.wait(), {
        loading: "Updating spending limit...",
        success: "Spending limit updated!",
        error: "Failed to update limit",
      });
      fetchCards();
    } catch (error) {
      console.error("Error changing limit:", error);
      toast.error(error.message || "Failed to change limit");
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Manage Your Smart Cards
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Wrong Network
          </h1>
          <p className="text-white mb-8">
            Please switch to the XPhere-Testnet network to manage your cards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Manage Your Smart Cards
          </h1>
          <button
            onClick={fetchCards}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <p className="text-white mt-4">Loading your cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <p className="text-white text-lg">You don&apos;t have any cards yet</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {cards.map((card) => (
              <div key={card.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Card #{card.id}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    card.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                  }`}>
                    {card.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-red-200 text-sm mb-1">Balance</p>
                    <p className="text-white font-bold">{card.balance} XPT</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-red-200 text-sm mb-1">Spending Limit</p>
                    <p className="text-white font-bold">{card.spendingLimit} XPT</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-red-200 text-sm mb-1">Amount Spent</p>
                    <p className="text-white font-bold">{card.amountSpent} XPT</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => toggleActive(card.id, card.isActive)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Power size={18} />
                    {card.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    onClick={() => resetSpent(card.id)}
                    disabled={loading || !card.isActive}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <RotateCcw size={18} />
                    Reset Spent
                  </button>

                  <button
                    onClick={() => openDepositModal(card.id)}
                    disabled={loading || !card.isActive}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Wallet2 size={18} />
                    Deposit
                  </button>

                  <button
                    onClick={() => openWithdrawModal(card.id, card.balance)}
                    disabled={loading || !card.isActive || parseFloat(card.balance) === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Wallet2 size={18} />
                    Withdraw
                  </button>

                  <button
                    onClick={() => changeLimit(card.id, card.spendingLimit)}
                    disabled={loading || !card.isActive}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <RefreshCw size={18} />
                    Change Limit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.type === 'deposit' ? "Deposit XPT" : "Withdraw XPT"}
        onSubmit={handleModalSubmit}
        loading={loading}
        submitText={modalState.type === 'deposit' ? "Deposit" : "Withdraw"}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">
              Amount (XPT)
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                step="0.1"
                min="0"
                max={modalState.type === 'withdraw' ? modalState.maxAmount : undefined}
                placeholder={`Enter amount to ${modalState.type || ''}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-white/50">XPT</span>
              </div>
            </div>
          </div>

          {modalState.type === 'withdraw' && (
            <p className="text-sm text-white/70">
              Available balance: {modalState.maxAmount} XPT
            </p>
          )}
        </div>
      </TransactionModal>
      
    </div>
  );
};

export default ManageCards;
