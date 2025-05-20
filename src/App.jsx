import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WalletProvider from "./context/WalletContext";

const Layout = lazy(() => import("./components/Layout"));
const Home = lazy(() => import("./pages/Home"));
import LoadingSpinner from "./components/LoadingSpinner";

const CreateCard = lazy(() => import("./pages/CreateCard"));
const ManageCards = lazy(() => import("./pages/ManageCards"));
const History = lazy(() => import("./pages/History"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Spend = lazy(() => import("./pages/Spend"));

const App = () => {
  return (
    <WalletProvider>
    <Router>
    <Suspense fallback={<LoadingSpinner />}>
    <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/create-card" element={<CreateCard />} />
      <Route path="/manage-cards" element={<ManageCards />} />
      <Route path="/spend" element={<Spend />} />
      <Route path="/history" element={<History />} />
      <Route path="/home" element={<Home />} />
    </Route>
    </Routes>
    </Suspense>
    </Router>
    </WalletProvider>
  );
};

export default App;
