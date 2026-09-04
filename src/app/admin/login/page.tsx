"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Dummy Authentication Logic
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

    if (email === "master@sparkz.com" && password === "admin123") {
      localStorage.setItem("admin_role", "master");
      router.push("/admin"); // Redirecting to master dashboard (to be built)
    } else if (email === "scanner@sparkz.com" && password === "scan123") {
      localStorage.setItem("admin_role", "subadmin");
      router.push("/admin/scanner");
    } else {
      setError("Invalid credentials. Access denied.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-[#E07020] selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#E07020]/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(255,0,0,0.15)]">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-['Orbitron',sans-serif] text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-[#E07020] uppercase tracking-wider">
              Admin Portal
            </h1>
            <p className="font-['Inter',sans-serif] text-sm text-slate-400 mt-2">
              Restricted Area. Authorized Personnel Only.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center">
                <p className="text-red-400 text-sm font-['Inter',sans-serif]">{error}</p>
              </div>
            )}

            <div className="space-y-4 font-['Inter',sans-serif]">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Clearance Email</label>
                <input
                  type="email"
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="admin@sparkz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Passcode</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full bg-black/50 border border-white/20 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-3 top-3.5 w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-lg font-['Orbitron',sans-serif] font-bold text-black bg-red-500 hover:bg-white hover:shadow-[0_0_20px_rgba(255,0,0,0.6)] transition-all duration-300 uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Override Protocol"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
