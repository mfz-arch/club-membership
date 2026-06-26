"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ShieldCheck, Users, Loader2, Sparkles, LogOut, CheckCircle2, User, IdCard, PlusCircle, Search, Layers } from "lucide-react";
import { db, collection, addDoc } from "@/lib/firebase";
import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

// --- NEW AVALANCHE SMART CONTRACT (CLUBHUB) ---
const CONTRACT_ADDRESS = "0x41657f8E851D5cf17ce6025Ca02dF2b677e3bD45";
const CONTRACT_ABI = [
  "function nextClubId() view returns (uint256)",
  "function clubs(uint256) view returns (uint256 id, string name, address creator, uint256 memberCount)",
  "function isMember(uint256, address) view returns (bool)",
  "function createClub(string _name) returns (uint256)",
  "function joinClub(uint256 _clubId)",
  "function getUserClubs(address _user) view returns (uint256[])"
];

// Types
type Club = {
  id: number;
  name: string;
  creator: string;
  memberCount: number;
};

type Member = {
  address: string;
  name: string;
  studentId: string;
  timestamp: string;
  clubId: number;
};

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"discover" | "myClubs" | "create">("discover");

  // Blockchain Data
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<number[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);

  // Form States
  const [newClubName, setNewClubName] = useState("");
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  const [joinClubId, setJoinClubId] = useState<number | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joinStudentId, setJoinStudentId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // --- CONNECT WALLET ---
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install Core Wallet or MetaMask extension to connect!");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await loadUserData(accounts[0]);
      }
    } catch (error: unknown) {
      console.error("User rejected request or error occurred", error);
      alert("Connection failed. Did you approve the request in your wallet?");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setMyClubIds([]);
  };

  const loadAllClubs = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setIsLoadingClubs(false);
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const nextId = await clubContract.nextClubId();
      const numClubs = Number(nextId) - 1;
      
      const clubsArray: Club[] = [];
      for (let i = 1; i <= numClubs; i++) {
        const clubData = await clubContract.clubs(i);
        clubsArray.push({
          id: Number(clubData.id),
          name: clubData.name,
          creator: clubData.creator,
          memberCount: Number(clubData.memberCount)
        });
      }
      setAllClubs(clubsArray);
    } catch (error) {
      console.error("Error loading clubs:", error);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAllClubs();
    }
    return () => { mounted = false; };
  }, []);

  const loadUserData = async (address: string) => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const userJoinedClubs = await clubContract.getUserClubs(address);
      const ids = userJoinedClubs.map((id: unknown) => Number(id));
      setMyClubIds(ids);
    } catch (error) {
      console.error("Error loading user clubs:", error);
    }
  };

  // --- ACTIONS ---
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return alert("Connect wallet first!");
    if (!newClubName.trim()) return alert("Enter a club name!");

    setIsCreatingClub(true);
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await clubContract.createClub(newClubName);
      await tx.wait();
      
      alert("Club created successfully on Avalanche!");
      setNewClubName("");
      await loadAllClubs();
      await loadUserData(walletAddress);
      setActiveTab("myClubs");
    } catch (error: unknown) {
      console.error("Create club failed:", error);
      if (error instanceof Error) {
        alert("Transaction Failed: " + error.message);
      } else {
        alert("Transaction failed.");
      }
    } finally {
      setIsCreatingClub(false);
    }
  };

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !joinClubId) return;

    setIsJoining(true);
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await clubContract.joinClub(joinClubId);
      await tx.wait();

      // Attempt to save off-chain data to Firebase, but don't hang if it fails
      const newMember: Member = {
        address: walletAddress,
        name: joinName,
        studentId: joinStudentId,
        timestamp: new Date().toISOString(),
        clubId: joinClubId
      };
      
      try {
        // Race condition timeout to prevent Firebase from hanging indefinitely if config is wrong
        const saveToFirebase = addDoc(collection(db, "members"), newMember);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase Timeout")), 3000));
        await Promise.race([saveToFirebase, timeout]);
      } catch (e) {
        console.warn("Firebase save skipped or timed out. Make sure your config is correct.", e);
      }

      alert("Successfully joined the club on-chain!");
      setJoinClubId(null);
      setJoinName("");
      setJoinStudentId("");
      await loadAllClubs();
      await loadUserData(walletAddress);
    } catch (error: unknown) {
      console.error("Join failed:", error);
      if (error instanceof Error) {
        alert("Transaction Failed: " + error.message);
      } else {
        alert("Transaction failed.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 selection:bg-amber-500/30 font-sans">
      
      {/* Header */}
      <header className="border-b border-amber-900/30 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2.5 rounded-xl text-black">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
              Web3 Club Hub
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {walletAddress ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-mono text-amber-200">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button 
                  onClick={disconnectWallet}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-amber-500/20"
              >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-12 border-b border-white/10 pb-1">
          <button 
            onClick={() => setActiveTab("discover")}
            className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "discover" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Search className="w-4 h-4" /> Discover Clubs
            {activeTab === "discover" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
          {walletAddress && (
            <button 
              onClick={() => setActiveTab("myClubs")}
              className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "myClubs" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Users className="w-4 h-4" /> My Clubs
              {activeTab === "myClubs" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
            </button>
          )}
          {walletAddress && (
            <button 
              onClick={() => setActiveTab("create")}
              className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "create" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              <PlusCircle className="w-4 h-4" /> Create Club
              {activeTab === "create" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
            </button>
          )}
        </div>

        {/* --- DISCOVER TAB --- */}
        {activeTab === "discover" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">Discover Communities</h2>
            
            {isLoadingClubs ? (
              <div className="flex items-center justify-center py-20 text-amber-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : allClubs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <p className="text-slate-400 mb-4">No clubs have been created yet.</p>
                {walletAddress && (
                  <button onClick={() => setActiveTab("create")} className="text-amber-400 font-medium hover:underline">
                    Be the first to create one!
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allClubs.map(club => {
                  const isAlreadyMember = myClubIds.includes(club.id);
                  return (
                    <div key={club.id} className="bg-[#111] border border-white/5 p-6 rounded-2xl hover:border-amber-500/30 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-slate-500 bg-black/50 px-2 py-1 rounded-md">
                          ID: {club.id}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{club.name}</h3>
                      <p className="text-slate-400 text-sm mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4" /> {club.memberCount} Members
                      </p>
                      
                      {!walletAddress ? (
                        <button onClick={connectWallet} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                          Connect to Join
                        </button>
                      ) : isAlreadyMember ? (
                        <button disabled className="w-full py-2.5 bg-green-500/10 text-green-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Joined
                        </button>
                      ) : (
                        <button 
                          onClick={() => setJoinClubId(club.id)}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-colors"
                        >
                          Join Community
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- MY CLUBS TAB --- */}
        {activeTab === "myClubs" && walletAddress && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-8">My Communities</h2>
            
            {myClubIds.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <p className="text-slate-400 mb-4">You haven&apos;t joined any clubs yet.</p>
                <button onClick={() => setActiveTab("discover")} className="text-amber-400 font-medium hover:underline">
                  Discover clubs to join
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allClubs.filter(c => myClubIds.includes(c.id)).map(club => (
                  <div key={club.id} className="bg-gradient-to-br from-[#111] to-black border border-amber-500/20 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                    <h3 className="text-2xl font-bold text-white mb-2">{club.name}</h3>
                    <p className="text-slate-400 text-sm mb-6">You are a verified member.</p>
                    <button className="w-full py-2.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl text-sm font-medium transition-colors">
                      Enter Dashboard
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CREATE CLUB TAB --- */}
        {activeTab === "create" && walletAddress && (
          <div className="max-w-md mx-auto">
            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-yellow-600" />
              <h2 className="text-2xl font-bold text-white mb-2">Create New Club</h2>
              <p className="text-slate-400 text-sm mb-8">Deploy a new community directly to the Avalanche blockchain.</p>
              
              <form onSubmit={handleCreateClub} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Club Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ShieldCheck className="h-5 w-5 text-amber-500/50" />
                    </div>
                    <input
                      type="text"
                      required
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-white placeholder-slate-600"
                      placeholder="e.g. Tanzania Web3 Builders"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingClub}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isCreatingClub ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Deploying on-chain...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Create Community</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* --- JOIN MODAL --- */}
      <AnimatePresence>
        {joinClubId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => setJoinClubId(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">Join Community</h2>
              <p className="text-slate-400 text-sm mb-6">
                You are about to join Club #{joinClubId}. Please provide your details for the off-chain roster.
              </p>

              <form onSubmit={handleJoinClub} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <input
                      type="text" required value={joinName} onChange={(e) => setJoinName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Student ID (Optional)</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                    <input
                      type="text" value={joinStudentId} onChange={(e) => setJoinStudentId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white"
                      placeholder="CS-2024-001"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={isJoining}
                  className="w-full mt-4 py-3.5 bg-amber-500 text-black rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign & Join on Avalanche"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
