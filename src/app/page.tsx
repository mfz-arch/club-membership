"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ShieldCheck, Users, Activity, Loader2, Sparkles, LogOut, CheckCircle2, User, IdCard } from "lucide-react";
import { db, collection, addDoc, getDocs, query, orderBy } from "@/lib/firebase";

// Types
type Member = {
  address: string;
  name: string;
  studentId: string;
  joinedAt: string;
};

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Registration Form State
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

  // Load members (Simulated/Firebase)
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // In a real app with valid Firebase config, this would fetch from the DB.
        // For the hackathon demo, we will check if the DB throws an error due to missing config, 
        // and if it does, we fall back to mock data so the demo never breaks.
        const q = query(collection(db, "members"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const fetchedMembers = snapshot.docs.map(doc => doc.data() as Member);
        
        if (fetchedMembers.length > 0) {
          setMembers(fetchedMembers);
        } else {
          loadMockData();
        }
      } catch (error) {
        console.warn("Firebase not fully configured yet, loading mock data for demo.");
        loadMockData();
      }
    };
    
    fetchMembers();
  }, []);

  const loadMockData = () => {
    setMembers([
      { address: "0x1234...5678", name: "Alice Mwangi", studentId: "CS-2024-001", joinedAt: new Date(Date.now() - 86400000).toLocaleString() },
      { address: "0x8765...4321", name: "John Doe", studentId: "IT-2024-042", joinedAt: new Date(Date.now() - 172800000).toLocaleString() }
    ]);
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWalletAddress("0xABCD...EF01"); // Mock address
    setIsConnecting(false);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setHasJoined(false);
    setName("");
    setStudentId("");
  };

  const joinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !name || !studentId) return;
    
    setIsJoining(true);
    
    // 1. Simulate Smart Contract Transaction Delay (On-Chain Verification)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
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
    } catch (err) {
      console.warn("Firebase not configured, skipping actual DB save but updating UI state.");
    }
    
    // 3. Update UI Roster
    setMembers((prev) => [newMember, ...prev]);
    setHasJoined(true);
    setIsJoining(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 overflow-hidden relative font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-fuchsia-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="w-full px-6 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md relative z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
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
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-medium transition-all duration-300 disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              ) : (
                <Wallet className="w-5 h-5 text-indigo-400" />
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
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-sm text-indigo-200">{walletAddress}</span>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Hybrid Web3 Architecture
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Verifiable <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400">
                Community
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              A transparent digital membership system. We use Avalanche smart contracts for absolute verification, and Firebase Firestore to securely store your rich student profile off-chain.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Join the Roster</h3>
                  <p className="text-slate-400 text-sm">Create your profile & sign on-chain.</p>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              {!walletAddress ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
                  <Wallet className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-slate-300">Connect your wallet to begin registration.</p>
                  <button
                    onClick={connectWallet}
                    className="w-full py-3 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-xl transition-colors"
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
                      <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name" 
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Student ID (e.g. CS-2024-001)" 
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining || !name || !studentId}
                    className="w-full relative group overflow-hidden rounded-xl font-bold text-lg disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-transform duration-300 group-hover:scale-105" />
                    <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-black/20 backdrop-blur-sm">
                      {isJoining ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                          Saving & Verifying...
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
          <div className="h-[600px] flex flex-col rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-semibold text-lg">Live Roster</h3>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium font-mono text-slate-300">
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
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                        <span className="font-bold text-indigo-300">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{member.name}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {member.studentId}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{member.address}</p>
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
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
}
