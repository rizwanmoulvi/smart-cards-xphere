import { useContext, useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { WalletContext } from "../context/WalletContext";
import abi from "../utils/abi.json";
import { Loader2, Wallet2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import toast from "react-hot-toast";

const contractAddress = import.meta.env.VITE_SMARTCARD_CONTRACT;

const History = () => {
  const { walletAddress, connectWallet, network } = useContext(WalletContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);

      // Get all events first
      const filter = {
        fromBlock: 0,
        toBlock: "latest",
        address: contractAddress,
      };

      // Fetch all events and then filter client-side
      const events = await Promise.all([
        contract.queryFilter(contract.filters.CardCreated(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.CardDeposited(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.CardWithdrawn(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.CardSpent(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.CardStatusChanged(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.SpendingLimitChanged(), filter.fromBlock, filter.toBlock)
      ]);

      const allEvents = events.flat().map(event => ({
        ...event,
        timestamp: new Date().getTime() // We'll update this with block timestamp
      }));

      // Get timestamps for all events
      await Promise.all(
        allEvents.map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          event.timestamp = block.timestamp * 1000;
        })
      );

      // Sort by timestamp, newest first
      allEvents.sort((a, b) => b.timestamp - a.timestamp);

      // First get all cards created by the user
      const userCards = new Set();
      allEvents.forEach(event => {
        if (event.event === "CardCreated" && 
            event.args.owner.toLowerCase() === walletAddress.toLowerCase()) {
          userCards.add(event.args.cardId.toString());
        }
      });

      // Filter events for user's cards
      const userEvents = allEvents.filter(event => {
        // Keep all card creation events by the user
        if (event.event === "CardCreated") {
          return event.args.owner.toLowerCase() === walletAddress.toLowerCase();
        }
        
        // For all other events, check if they're related to user's cards
        const cardId = event.args.cardId?.toString();
        return cardId && userCards.has(cardId);
      });

      setEvents(userEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatEventData = (event) => {
    switch (event.event) {
      case "CardCreated":
        return {
          title: "Card Created",
          description: `Card #${event.args.cardId} created with ${ethers.utils.formatEther(event.args.spendingLimit)} XPT limit`,
          icon: <Wallet2 className="w-6 h-6 text-green-500" />,
          timestamp: event.timestamp
        };
      case "CardDeposited":
        return {
          title: "Deposit",
          description: `${ethers.utils.formatEther(event.args.amount)} XPT deposited to Card #${event.args.cardId}`,
          icon: <ArrowDownLeft className="w-6 h-6 text-emerald-500" />,
          timestamp: event.timestamp
        };
      case "CardWithdrawn":
        return {
          title: "Withdrawal",
          description: `${ethers.utils.formatEther(event.args.amount)} XPT withdrawn from Card #${event.args.cardId}`,
          icon: <ArrowUpRight className="w-6 h-6 text-red-500" />,
          timestamp: event.timestamp
        };
      case "CardSpent":
        return {
          title: "Spent",
          description: `${ethers.utils.formatEther(event.args.amount)} XPT spent from Card #${event.args.cardId}`,
          icon: <ArrowUpRight className="w-6 h-6 text-orange-500" />,
          timestamp: event.timestamp
        };
      case "CardStatusChanged":
        return {
          title: "Status Changed",
          description: `Card #${event.args.cardId} ${event.args.isActive ? "activated" : "deactivated"}`,
          icon: <Wallet2 className="w-6 h-6 text-blue-500" />,
          timestamp: event.timestamp
        };
      case "SpendingLimitChanged":
        return {
          title: "Limit Changed",
          description: `Card #${event.args.cardId} limit changed to ${ethers.utils.formatEther(event.args.newLimit)} XPT`,
          icon: <Wallet2 className="w-6 h-6 text-purple-500" />,
          timestamp: event.timestamp
        };
      default:
        return null;
    }
  };

  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Transaction History
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
            Please switch to the XPhere-Testnet network to view transaction history
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
            Transaction History
          </h1>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <Loader2 className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <p className="text-white mt-4">Loading transaction history...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <p className="text-white text-lg">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const eventData = formatEventData(event);
              if (!eventData) return null;

              return (
                <div
                  key={`${event.blockNumber}-${event.logIndex}`}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      {eventData.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {eventData.title}
                      </h3>
                      <p className="text-red-200">
                        {eventData.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-200">
                        {new Date(eventData.timestamp).toLocaleString()}
                      </p>
                      <a
                        href={`https://testnet.xpherscan.com/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-300 hover:text-red-400 transition-colors"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;