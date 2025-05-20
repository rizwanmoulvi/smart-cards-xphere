import { Link } from "react-router-dom";
import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import { Shield, CreditCard, LineChart, Wallet, Users } from "lucide-react";

const Home = () => {
  const { walletAddress, connectWallet } = useContext(WalletContext);

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        {!walletAddress ? (
          <>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Smart Card Management System
              </h1>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Create virtual cards with spending limits, track expenses, and manage your crypto assets securely.
              </p>
              <button
                onClick={connectWallet}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-300"
              >
                Connect Wallet to Get Started
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="bg-pink-500/20 p-3 rounded-xl w-fit mb-4">
                  <Shield className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Enhanced Security</h3>
                <p className="text-white/70">
                  Virtual cards act as sub-wallets with spending limits, protecting your main funds from potential risks and unauthorized access.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="bg-purple-500/20 p-3 rounded-xl w-fit mb-4">
                  <LineChart className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Expense Tracking</h3>
                <p className="text-white/70">
                  Track daily, weekly, and monthly spending with detailed transaction history and real-time balances for better budgeting.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="bg-green-500/20 p-3 rounded-xl w-fit mb-4">
                  <CreditCard className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Controlled Spending</h3>
                <p className="text-white/70">
                  Set spending limits and create purpose-specific cards for subscriptions, gaming, or regular payments.
                </p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">🎯 Key Features</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-4">Virtual Cards</h3>
                    <ul className="space-y-3 text-white/70">
                      <li>• Create multiple cards with custom spending limits</li>
                      <li>• Set daily, weekly, or monthly budgets</li>
                      <li>• Fund cards from your main wallet</li>
                      <li>• Withdraw unused funds anytime</li>
                    </ul>
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-4">Expense Management</h3>
                    <ul className="space-y-3 text-white/70">
                      <li>• Real-time transaction tracking</li>
                      <li>• Detailed spending analytics</li>
                      <li>• Transaction history with filtering</li>
                      <li>• Export reports for accounting</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white mb-8">💡 Use Cases</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-4">
                      <Wallet className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Daily Spending</h3>
                    <p className="text-white/70">
                      Create cards with monthly limits for subscriptions and regular purchases without risking your main wallet.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="bg-yellow-500/20 p-3 rounded-xl w-fit mb-4">
                      <Users className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Parental Controls</h3>
                    <p className="text-white/70">
                      Set up cards with allowances for family members with controlled spending limits and monitoring.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="bg-red-500/20 p-3 rounded-xl w-fit mb-4">
                      <CreditCard className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Gaming Credits</h3>
                    <p className="text-white/70">
                      Use dedicated cards for in-game purchases and NFT trading with preset spending boundaries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-8">Welcome to Smart Cards</h1>
            <div className="flex gap-4 justify-center">
              <Link
                to="/create"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-300"
              >
                Create New Card
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
