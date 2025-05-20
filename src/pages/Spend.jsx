import { useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { WalletContext } from "../context/WalletContext";
import { QRCodeSVG } from "qrcode.react";
import QRScannerModal from "../components/QRScannerModal";
import abi from "../utils/abi.json";
import { 
  Loader2, 
  Wallet2, 
  QrCode,
  SendHorizontal,
  ArrowRight,
  ChevronDown,
  Clock,
  ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";

const contractAddress = import.meta.env.VITE_SMARTCARD_CONTRACT;

const Spend = () => {
  const { walletAddress, connectWallet, network } = useContext(WalletContext);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [recentSpends, setRecentSpends] = useState([]);

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
          if (i > 1000) break;
        } catch (err) {
          break;
        }
      }

      setCards(fetchedCards.filter(card => card.isActive && parseFloat(card.balance) > 0));
    } catch (err) {
      console.error("Error fetching cards:", err);
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const fetchRecentSpends = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);

      const filter = {
        fromBlock: 0,
        toBlock: "latest",
        address: contractAddress,
      };

      const events = await contract.queryFilter(contract.filters.CardSpent(), filter.fromBlock, filter.toBlock);
      
      const spendEvents = [];
      for (const event of events) {
        const owner = event.args.from;
        if (owner && owner.toLowerCase() === walletAddress.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          spendEvents.push({
            ...event,
            timestamp: block.timestamp * 1000,
          });
        }
      }

      spendEvents.sort((a, b) => b.timestamp - a.timestamp);
      setRecentSpends(spendEvents);
    } catch (err) {
      console.error("Error fetching recent spends:", err);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchCards();
    fetchRecentSpends();
  }, [fetchCards, fetchRecentSpends]);

  const handleQRScan = (data) => {
    if (ethers.utils.isAddress(data)) {
      setRecipient(data);
      toast.success("Address scanned successfully!");
    } else {
      toast.error("Invalid QR code. Please scan a valid address.");
    }
  };

  const handleSpend = async (e) => {
    e.preventDefault();
    
    if (!selectedCard) {
      toast.error("Please select a card");
      return;
    }

    if (!ethers.utils.isAddress(recipient)) {
      toast.error("Please enter a valid recipient address");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount > parseFloat(selectedCard.balance)) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);

      const amountInWei = ethers.utils.parseEther(amount);
      const tx = await contract.spend(selectedCard.id, amountInWei, recipient);
      
      await toast.promise(tx.wait(), {
        loading: "Processing transaction...",
        success: "Payment successful!",
        error: "Transaction failed",
      });

      setAmount("");
      setRecipient("");
      fetchCards();
      fetchRecentSpends();
    } catch (error) {
      console.error("Error spending:", error);
      toast.error(error.message || "Failed to spend");
    } finally {
      setLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Spend with Smart Card
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
            Please switch to the XPhere-Testnet network to spend
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Spend with Smart Card
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <form onSubmit={handleSpend} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Card
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCard ? selectedCard.id : ""}
                      onChange={(e) => {
                        const card = cards.find(c => c.id === parseInt(e.target.value));
                        setSelectedCard(card);
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a card</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          Card #{card.id} - Balance: {card.balance} XPT
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Amount (XPT)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={selectedCard ? selectedCard.balance : undefined}
                      placeholder="Enter amount"
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

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Recipient Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter recipient address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowScanner(!showScanner)}
                      className="px-3 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                    >
                      <QrCode size={24} />
                    </button>
                  </div>
                </div>

                <QRScannerModal 
                  isOpen={showScanner} 
                  onClose={() => setShowScanner(false)}
                  onScan={handleQRScan}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                  Send Payment
                </button>

                {selectedCard && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowQR(!showQR)}
                      className="text-sm text-white/70 hover:text-white"
                    >
                      {showQR ? "Hide" : "Show"} Card QR Code
                    </button>
                  </div>
                )}
              </form>

              {showQR && selectedCard && (
                <div className="mt-6 p-4 bg-white rounded-2xl">
                  <QRCodeSVG
                    value={`${selectedCard.id}`}
                    size={200}
                    className="mx-auto"
                  />
                  <p className="text-center mt-2 text-sm text-gray-600">
                    Card #{selectedCard.id}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {selectedCard && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Selected Card Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-red-200 text-sm">Balance</p>
                    <p className="text-white font-bold">{selectedCard.balance} XPT</p>
                  </div>
                  <div>
                    <p className="text-red-200 text-sm">Spending Limit</p>
                    <p className="text-white font-bold">{selectedCard.spendingLimit} XPT</p>
                  </div>
                  <div>
                    <p className="text-red-200 text-sm">Amount Spent</p>
                    <p className="text-white font-bold">{selectedCard.amountSpent} XPT</p>
                  </div>
                  <div>
                    <p className="text-red-200 text-sm">Available to Spend</p>
                    <p className="text-white font-bold">
                      {(parseFloat(selectedCard.spendingLimit) - parseFloat(selectedCard.amountSpent)).toFixed(2)} XPT
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Transactions
              </h3>
              <div className="space-y-4">
                {recentSpends.slice(0, 5).map((spend) => (
                  <div
                    key={`${spend.blockNumber}-${spend.logIndex}`}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div>
                      <p className="text-white">
                        Card #{spend.args.cardId.toString()}
                      </p>
                      <p className="text-sm text-white/70">
                        To: {spend.args.recipient.slice(0, 6)}...{spend.args.recipient.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-pink-400 font-medium">
                        -{ethers.utils.formatEther(spend.args.amount)} XPT
                      </p>
                      <p className="text-sm text-white/70">
                        {new Date(spend.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentSpends.length === 0 && (
                  <p className="text-white/70 text-center py-4">
                    No recent transactions
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spend;
