"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ShieldCheck, Users, Activity, Loader2, Sparkles, LogOut, CheckCircle2, User, IdCard } from "lucide-react";
import { db, collection, addDoc, getDocs, query, orderBy } from "@/lib/firebase";
import { BrowserProvider, Contract } from "ethers";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

// Types
type Member = {
  address: string;
  name: string;
  studentId: string;
  joinedAt: string;
};

// --- WEB3 CONFIGURATION ---
// The deployed contract address from Remix
const CONTRACT_ADDRESS = "0x2f46e39c4702c225C7E65dFFe741c9c7c63C1540";

// The ABI matches the ClubMembership.sol functions
const CONTRACT_ABI = [
  "function joinClub() public",
  "function getMemberCount() public view returns (uint256)",
  "function getAllMembers() public view returns (address[] memory)",
  "event MemberJoined(address indexed memberAddress, uint256 timestamp)"
];

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Registration Form State
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

  const loadMockData = () => {
    setMembers([
      { address: "0x1234...5678", name: "Alice Mwangi", studentId: "CS-2024-001", joinedAt: new Date(Date.now() - 86400000).toLocaleString() },
      { address: "0x8765...4321", name: "John Doe", studentId: "IT-2024-042", joinedAt: new Date(Date.now() - 172800000).toLocaleString() }
    ]);
  };

  // Load members (Simulated/Firebase)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, "members"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const fetchedMembers = snapshot.docs.map(doc => doc.data() as Member);
        
        if (fetchedMembers.length > 0) {
          setMembers(fetchedMembers);
        } else {
          loadMockData();
        }
      } catch (e) {
        console.error("Firebase load error:", e);
        console.warn("Firebase not fully configured yet, loading mock data for demo.");
        loadMockData();
      }
    };
    
    fetchMembers();
  }, []);

  // --- REAL WEB3 CONNECTION ---
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install Core Wallet or MetaMask extension to connect!");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      // Request access to the user's wallet
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error("User rejected request or error occurred", error);
      alert("Connection failed. Did you approve the request in your wallet?");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setHasJoined(false);
    setName("");
    setStudentId("");
  };

  // --- REAL WEB3 TRANSACTION ---
  const joinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !name || !studentId) return;
    
    setIsJoining(true);
    
    try {
      // 1. Send Smart Contract Transaction (On-Chain Verification)
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const clubContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Sending transaction to Avalanche...");
      const tx = await clubContract.joinClub();
      
      console.log("Waiting for confirmation... tx hash:", tx.hash);
      await tx.wait(); // Wait for the transaction to be mined
      
      console.log("Transaction confirmed!");
      
      // 2. Save rich profile data to Firebase (Off-Chain Storage)
      const newMember = {
        address: walletAddress,
        name,
        studentId,
        joinedAt: new Date().toLocaleString(),
        timestamp: Date.now()
      };
      
      try {
        await addDoc(collection(db, "members"), newMember);
      } catch (e) {
        console.error("Firebase save error:", e);
        console.warn("Firebase not configured, skipping actual DB save but updating UI state.");
      }
      
      // 3. Update UI Roster
      setMembers((prev) => [newMember, ...prev]);
      setHasJoined(true);
    } catch (error: unknown) {
      console.error("Transaction failed", error);
      if (error instanceof Error) {
        alert("Transaction Failed: " + error.message);
      } else {
        alert("Transaction failed. Make sure you have test AVAX and are on the Fuji Testnet.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-slate-50 selection:bg-amber-500/30 overflow-hidden relative font-sans">
      {/* Premium Dark/Gold Background Gradients */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-yellow-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full px-6 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md relative z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/20">
            <Users className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-amber-500">
            Nexus Student Club
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!walletAddress ? (
            <motion.button
              key="connect"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full font-medium transition-all duration-300 disabled:opacity-50 text-amber-100"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              ) : (
                <Wallet className="w-5 h-5 text-amber-400" />
              )}
              {isConnecting ? "Connecting..." : "Connect Core Wallet"}
            </motion.button>
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-sm text-amber-200">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Disconnect"
              >
                <LogOut className="w-5 h-5 text-slate-400 hover:text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Hero & Action */}
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Premium Web3 Architecture
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white">
              Verifiable <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-sm">
                Community
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              An exclusive digital membership system. We use Avalanche smart contracts for absolute verification, and Firebase Firestore to securely store your profile off-chain.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-[#111] border border-amber-500/20 backdrop-blur-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-600/5 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-amber-100">Join the Roster</h3>
                  <p className="text-amber-500/60 text-sm">Create your profile & sign on-chain.</p>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              {!walletAddress ? (
                <div className="p-6 rounded-2xl bg-black/40 border border-amber-500/10 text-center space-y-4">
                  <Wallet className="w-12 h-12 text-amber-500/50 mx-auto" />
                  <p className="text-slate-300">Connect your wallet to begin registration.</p>
                  <button
                    onClick={connectWallet}
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:opacity-90 font-bold rounded-xl transition-opacity"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : hasJoined ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-emerald-300 font-semibold text-lg">Profile Saved & Verified!</h4>
                  <p className="text-emerald-400/80 text-sm">Your name is safely stored off-chain, and your wallet ownership is verified on Avalanche.</p>
                </div>
              ) : (
                <form onSubmit={joinClub} className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-amber-500/50" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name" 
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-amber-500/20 rounded-xl focus:outline-none focus:border-amber-500 text-amber-50 placeholder-amber-500/30 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 w-5 h-5 text-amber-500/50" />
                      <input 
                        type="text" 
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Student ID (e.g. CS-2024-001)" 
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-amber-500/20 rounded-xl focus:outline-none focus:border-amber-500 text-amber-50 placeholder-amber-500/30 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining || !name || !studentId}
                    className="w-full relative group overflow-hidden rounded-xl font-bold text-lg disabled:opacity-50 text-black"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-600 transition-transform duration-300 group-hover:scale-105" />
                    <div className="relative flex items-center justify-center gap-3 px-6 py-4">
                      {isJoining ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-black" />
                          Confirming on Avalanche...
                        </>
                      ) : (
                        <>
                          Sign Transaction to Join
                          <Activity className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Active Roster */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:pl-10"
        >
          <div className="h-[600px] flex flex-col rounded-3xl bg-[#111] border border-amber-500/20 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-amber-500/20 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                <h3 className="font-semibold text-lg text-amber-100">Live Roster</h3>
              </div>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-medium font-mono text-amber-300">
                {members.length} Members
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence>
                {members.map((member, idx) => (
                  <motion.div
                    key={member.address + idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-black/40 hover:bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center border border-amber-300/30 shadow-inner">
                        <span className="font-bold text-black">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-amber-50">{member.name}</p>
                        <p className="text-xs text-amber-500/70 font-mono">ID: {member.studentId}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono group-hover:text-amber-500/50 transition-colors">
                          {member.address.length > 20 ? `${member.address.substring(0, 6)}...${member.address.substring(member.address.length - 4)}` : member.address}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </main>
  );
}
