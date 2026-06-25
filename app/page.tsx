"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ShieldCheck, Users, Activity, Loader2, Sparkles, LogOut, CheckCircle2 } from "lucide-react";

// Types
type Member = {
  address: string;
  joinedAt: string;
};

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  // Simulate fetching members
  useEffect(() => {
    // Mock initial members
    setMembers([
      { address: "0x1234...5678", joinedAt: new Date(Date.now() - 86400000).toLocaleString() },
      { address: "0x8765...4321", joinedAt: new Date(Date.now() - 172800000).toLocaleString() }
    ]);
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWalletAddress("0xABCD...EF01");
    setIsConnecting(false);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setHasJoined(false);
  };

  const joinClub = async () => {
    if (!walletAddress) return;
    setIsJoining(true);
    // Simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setMembers((prev) => [
      { address: walletAddress, joinedAt: new Date().toLocaleString() },
      ...prev,
    ]);
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
              Avalanche Hackathon - Track 4
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Verifiable <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400">
                Community
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              A transparent, blockchain-powered digital membership system for African student clubs. No more lost paper sheets—just undeniable, verifiable proof of belonging on the Avalanche network.
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
                  <p className="text-slate-400 text-sm">Secure your spot permanently on-chain.</p>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              {!walletAddress ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
                  <Wallet className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-slate-300">Connect your wallet to join the club.</p>
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
                  <h4 className="text-emerald-300 font-semibold text-lg">Officially a Member!</h4>
                  <p className="text-emerald-400/80 text-sm">Your membership is secured on the blockchain.</p>
                </div>
              ) : (
                <button
                  onClick={joinClub}
                  disabled={isJoining}
                  className="w-full relative group overflow-hidden rounded-xl font-bold text-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-transform duration-300 group-hover:scale-105" />
                  <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-black/20 backdrop-blur-sm">
                    {isJoining ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10 shadow-inner group-hover:border-indigo-500/50 transition-colors">
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div>
                        <p className="font-mono text-slate-200">{member.address}</p>
                        <p className="text-xs text-slate-500">Joined: {member.joinedAt}</p>
                      </div>
                    </div>
                    <a
                      href={`https://subnets-test.avax.network/c-chain/address/${member.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View explorer
                    </a>
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
