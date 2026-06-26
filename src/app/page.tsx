"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ShieldCheck, Users, Loader2, Sparkles, LogOut, CheckCircle2, User, IdCard, PlusCircle, Search, Layers, Home } from "lucide-react";
import { db, collection, addDoc, getDocs, query, orderBy, limit } from "@/lib/firebase";
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
type Club = { id: number; name: string; creator: string; memberCount: number; };
type Member = { address: string; name: string; studentId: string; timestamp: string; clubId: number; };

export default function Page() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "discover" | "myClubs" | "create">("home");

  // Blockchain & Firebase Data
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<number[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);

  // Form States
  const [newClubName, setNewClubName] = useState("");
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  const [joinClubId, setJoinClubId] = useState<number | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joinStudentId, setJoinStudentId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // --- WALLET ---
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setMyClubIds([]);
    setActiveTab("home");
  };

  // --- LOAD DATA ---
  useEffect(() => {
    let mounted = true;
    const fetchInitData = async () => {
      // 1. Load Blockchain Clubs
      if (typeof window !== "undefined" && window.ethereum) {
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
          if (mounted) setAllClubs(clubsArray);
        } catch (e) {
          console.error(e);
        }
      }
      
      // 2. Load Firebase Global Roster (Most recent 10 members)
      try {
        const q = query(collection(db, "members"), orderBy("timestamp", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedMembers = querySnapshot.docs.map(doc => doc.data() as Member);
        if (mounted) setRecentMembers(fetchedMembers);
      } catch (e) {
        console.error("Firebase error:", e);
      }
      
      if (mounted) setIsLoadingClubs(false);
    };

    fetchInitData();
    return () => { mounted = false; };
  }, []);

  const loadUserData = async (address: string) => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const userJoinedClubs = await clubContract.getUserClubs(address);
      setMyClubIds(userJoinedClubs.map((id: unknown) => Number(id)));
    } catch (e) {
      console.error(e);
    }
  };

  // --- ACTIONS ---
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return alert("Connect wallet first!");
    setIsCreatingClub(true);
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await clubContract.createClub(newClubName);
      await tx.wait();
      alert("Club created successfully!");
      setNewClubName("");
      // Reload user data
      await loadUserData(walletAddress);
      setActiveTab("myClubs");
    } catch (e: unknown) {
      if (e instanceof Error) alert("Failed: " + e.message);
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

      const newMember: Member = {
        address: walletAddress,
        name: joinName,
        studentId: joinStudentId,
        timestamp: new Date().toISOString(),
        clubId: joinClubId
      };
      
      try {
        const saveTask = addDoc(collection(db, "members"), newMember);
        const timeout = new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 3000));
        await Promise.race([saveTask, timeout]);
      } catch (err) {
        console.warn("Firebase skipped");
      }

      alert("Successfully joined on-chain!");
      setJoinClubId(null);
      setJoinName("");
      setJoinStudentId("");
      await loadUserData(walletAddress);
      setActiveTab("myClubs");
    } catch (e: unknown) {
      if (e instanceof Error) alert("Failed: " + e.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-amber-50 selection:bg-amber-500/30 overflow-hidden relative font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-yellow-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-amber-900/30 bg-[#0a0a0a]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2.5 rounded-xl text-black shadow-lg shadow-amber-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-100 to-amber-500 bg-clip-text text-transparent">
              Web3 Club Hub
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {walletAddress ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                  <span className="text-sm font-mono text-amber-200">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button onClick={disconnectWallet} className="p-2 text-amber-500/50 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium transition-all"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Only show if connected OR if not home) */}
        <div className="max-w-7xl mx-auto px-6 flex gap-6 pt-2">
          <button onClick={() => setActiveTab("home")} className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "home" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
            <Home className="w-4 h-4" /> Home
            {activeTab === "home" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
          <button onClick={() => setActiveTab("discover")} className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "discover" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
            <Search className="w-4 h-4" /> Discover
            {activeTab === "discover" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
          {walletAddress && (
            <button onClick={() => setActiveTab("myClubs")} className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "myClubs" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
              <Users className="w-4 h-4" /> My Clubs
              {activeTab === "myClubs" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
            </button>
          )}
          {walletAddress && (
            <button onClick={() => setActiveTab("create")} className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors relative ${activeTab === "create" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
              <PlusCircle className="w-4 h-4" /> Create Club
              {activeTab === "create" && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* --- HOME TAB (RESTORED ORIGINAL DESIGN) --- */}
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Premium Web3 Architecture
                </div>

                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
                  Verifiable<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">
                    Community
                  </span>
                </h1>

                <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                  An exclusive digital membership system. We use Avalanche smart contracts for absolute verification, and Firebase Firestore to securely store profiles off-chain.
                </p>

                <div className="p-8 rounded-3xl bg-[#111] border border-amber-500/20 backdrop-blur-md shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-600/5 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-semibold mb-2 text-amber-100">Access Platform</h3>
                        <p className="text-amber-500/60 text-sm">Join, create, and manage your clubs.</p>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <ShieldCheck className="w-8 h-8 text-amber-400" />
                      </div>
                    </div>

                    {!walletAddress ? (
                      <div className="p-6 rounded-2xl bg-black/40 border border-amber-500/10 text-center space-y-4">
                        <Wallet className="w-12 h-12 text-amber-500/50 mx-auto" />
                        <p className="text-slate-300">Connect your wallet to begin.</p>
                        <button onClick={connectWallet} className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:opacity-90 font-bold rounded-xl transition-opacity">
                          Connect Wallet
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setActiveTab("discover")} className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors flex flex-col items-center gap-2 text-sm text-slate-300">
                          <Search className="w-5 h-5 text-amber-400" /> Discover Clubs
                        </button>
                        <button onClick={() => setActiveTab("create")} className="py-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl font-medium transition-colors flex flex-col items-center gap-2 text-sm text-amber-400">
                          <PlusCircle className="w-5 h-5" /> Create Club
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Global Roster */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:pl-10">
                <div className="h-[600px] flex flex-col rounded-3xl bg-[#111] border border-amber-500/20 backdrop-blur-xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-amber-500/20 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                      <h3 className="font-semibold text-lg text-amber-100">Global Roster (Recent)</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {recentMembers.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm">No recent members found off-chain.</div>
                    ) : (
                      recentMembers.map((member, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 hover:bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center border border-amber-300/30 shadow-inner">
                              <span className="font-bold text-black">{member.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-amber-50">{member.name}</p>
                              <p className="text-xs text-amber-500/70 font-mono">Joined Club #{member.clubId}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* --- DISCOVER TAB --- */}
          {activeTab === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h2 className="text-3xl font-bold text-white">Discover Communities</h2>
              {isLoadingClubs ? (
                <div className="py-20 text-center text-amber-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
              ) : allClubs.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-slate-400">No clubs created yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allClubs.map(club => {
                    const isAlreadyMember = myClubIds.includes(club.id);
                    return (
                      <div key={club.id} className="bg-[#111] border border-white/5 p-6 rounded-2xl hover:border-amber-500/30 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400 group-hover:bg-amber-500/20 transition-colors"><ShieldCheck className="w-6 h-6" /></div>
                          <span className="text-xs font-mono text-slate-500 bg-black/50 px-2 py-1 rounded-md">ID: {club.id}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{club.name}</h3>
                        <p className="text-slate-400 text-sm mb-6 flex items-center gap-2"><Users className="w-4 h-4" /> {club.memberCount} Members</p>
                        
                        {!walletAddress ? (
                          <button onClick={connectWallet} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium">Connect to Join</button>
                        ) : isAlreadyMember ? (
                          <button disabled className="w-full py-2.5 bg-green-500/10 text-green-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Joined</button>
                        ) : (
                          <button onClick={() => setJoinClubId(club.id)} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-semibold transition-colors">Join Community</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* --- MY CLUBS TAB --- */}
          {activeTab === "myClubs" && walletAddress && (
            <motion.div key="myClubs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h2 className="text-3xl font-bold text-white">My Communities</h2>
              {myClubIds.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-slate-400">You haven&apos;t joined any clubs yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allClubs.filter(c => myClubIds.includes(c.id)).map(club => (
                    <div key={club.id} className="bg-gradient-to-br from-[#111] to-black border border-amber-500/20 p-6 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                      <h3 className="text-2xl font-bold text-white mb-2">{club.name}</h3>
                      <p className="text-slate-400 text-sm mb-6">You are a verified member.</p>
                      <button className="w-full py-2.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl text-sm font-medium transition-colors">Enter Dashboard</button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- CREATE TAB --- */}
          {activeTab === "create" && walletAddress && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto pt-8">
              <div className="bg-[#111] border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-yellow-600" />
                <h2 className="text-2xl font-bold text-white mb-2">Create New Club</h2>
                <p className="text-slate-400 text-sm mb-8">Deploy a new community directly to the Avalanche blockchain.</p>
                <form onSubmit={handleCreateClub} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Club Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ShieldCheck className="h-5 w-5 text-amber-500/50" /></div>
                      <input type="text" required value={newClubName} onChange={(e) => setNewClubName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-white" placeholder="e.g. Tanzania Web3 Builders" />
                    </div>
                  </div>
                  <button type="submit" disabled={isCreatingClub} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                    {isCreatingClub ? <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</> : <><Sparkles className="w-5 h-5" /> Create Community</>}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* JOIN MODAL */}
      <AnimatePresence>
        {joinClubId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full relative">
              <button onClick={() => setJoinClubId(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
              <h2 className="text-2xl font-bold text-white mb-2">Join Community</h2>
              <p className="text-slate-400 text-sm mb-6">Join Club #{joinClubId}. Provide details for the off-chain roster.</p>
              <form onSubmit={handleJoinClub} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <input type="text" required value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white" placeholder="Full Name" />
                </div>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <input type="text" value={joinStudentId} onChange={(e) => setJoinStudentId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl focus:border-amber-500 outline-none text-white" placeholder="Student ID (Optional)" />
                </div>
                <button type="submit" disabled={isJoining} className="w-full mt-4 py-3.5 bg-amber-500 text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70">
                  {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign & Join on Avalanche"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.4); }
      `}</style>
    </main>
  );
}
