"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, CheckCircle, IndianRupee, Utensils, Users, Search, Lock, ShieldAlert, LogOut, Trash2, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

type Tab = "operations" | "performers" | "treasury" | "manage_admins";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [isWebAdmin, setIsWebAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("operations");
  
  // Treasury Data
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalDisbursed, setTotalDisbursed] = useState(0);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [utrInput, setUtrInput] = useState<{ [key: string]: string }>({});

  // Operations Data
  const [vegCount, setVegCount] = useState(0);
  const [nonVegCount, setNonVegCount] = useState(0);

  // Performers Data
  const [performers, setPerformers] = useState<any[]>([]);

  // Master Admin Data
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setCheckingAuth(true);
      if (u && u.email) {
        if (u.email.toLowerCase() === "rajeshbiswas0510@gmail.com") {
          setIsMasterAdmin(true);
          setIsWebAdmin(true);
          setUser(u);
          setActiveTab("treasury");
        } else {
          // Check if email is in admins collection
          if (db) {
            const adminDoc = await getDoc(doc(db, "admins", u.email.toLowerCase()));
            if (adminDoc.exists()) {
              setIsWebAdmin(true);
              setUser(u);
            } else {
              await signOut(auth);
              setUser(null);
              alert("Access Denied: Your email is not registered as an Admin.");
            }
          }
        }
      } else {
        setUser(null);
        setIsMasterAdmin(false);
        setIsWebAdmin(false);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!auth) return alert("Firebase Auth is not configured");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error(error);
      alert("Login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  useEffect(() => {
    if (!isWebAdmin || !db) return;

    // Fetch Treasury Data
    const fetchTreasury = async () => {
      const q28 = query(collection(db, "users"), where("batch", "==", "28"), where("payment_status", "==", true));
      const snap28 = await getDocs(q28);
      // Depending on logic, say each contribution is 501 on average for calculation, or real data
      setTotalCollected(snap28.size * 501); 

      const unsubDis = onSnapshot(collection(db, "disbursements"), (snap) => {
        const disData: any[] = [];
        let disbursedSum = 0;
        snap.forEach((doc) => {
          const d = { id: doc.id, ...doc.data() };
          disData.push(d);
          if (d.status === "disbursed") disbursedSum += Number(d.amount);
        });
        setDisbursements(disData);
        setTotalDisbursed(disbursedSum);
      });
      return () => unsubDis();
    };

    // Fetch Operations Data
    const fetchOperations = async () => {
      const q29 = query(collection(db, "users"), where("batch", "==", "29"));
      const snap29 = await getDocs(q29);
      let veg = 0;
      let nonVeg = 0;
      snap29.forEach((doc) => {
        if (doc.data().food_preference === "Veg") veg++;
        if (doc.data().food_preference === "Non-Veg") nonVeg++;
      });
      setVegCount(veg);
      setNonVegCount(nonVeg);
    };

    // Fetch Performers Data
    const fetchPerformers = async () => {
      const qPerf = query(collection(db, "users"), where("batch", "==", "29"), where("is_participating", "==", true));
      const snapPerf = await getDocs(qPerf);
      const perfData: any[] = [];
      snapPerf.forEach((doc) => {
        perfData.push(doc.data());
      });
      setPerformers(perfData);
    };

    // Fetch Admins if Master Admin
    const fetchAdmins = async () => {
      if (!isMasterAdmin) return;
      const unsub = onSnapshot(collection(db, "admins"), (snap) => {
        const emails: string[] = [];
        snap.forEach((doc) => emails.push(doc.id));
        setAdminEmails(emails);
      });
      return () => unsub();
    };

    fetchTreasury();
    fetchOperations();
    fetchPerformers();
    if (isMasterAdmin) fetchAdmins();

  }, [isWebAdmin, isMasterAdmin]);

  const markDisbursed = async (id: string) => {
    if (!db) return;
    const utr = utrInput[id];
    if (!utr) return alert("Please enter UTR number");
    await updateDoc(doc(db, "disbursements", id), {
      status: "disbursed",
      utr_number: utr
    });
  };

  const exportPDF = (student: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`SPARKZ 2k26 - ${student.talent_category} Performer`, 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Name: ${student.name}`, 20, 40);
    doc.text(`Roll Number: ${student.roll_number}`, 20, 50);
    
    doc.setFontSize(12);
    doc.text("Answers:", 20, 70);
    
    let y = 80;
    if (student.fresher_answers) {
      Object.entries(student.fresher_answers).forEach(([key, value]) => {
        const textLines = doc.splitTextToSize(`${key}: ${value}`, 170);
        doc.text(textLines, 20, y);
        y += (10 * textLines.length);
      });
    }

    doc.save(`${student.roll_number}_profile.pdf`);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !db) return;
    try {
      await setDoc(doc(db, "admins", newAdminEmail.toLowerCase().trim()), {
        added_at: new Date().toISOString()
      });
      setNewAdminEmail("");
    } catch (err) {
      console.error(err);
      alert("Failed to add admin.");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!db) return;
    if (confirm(`Remove ${email} from admins?`)) {
      await deleteDoc(doc(db, "admins", email));
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-cyan-500 font-mono">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!isWebAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00E5FF1A_1px,transparent_1px),linear-gradient(to_bottom,#00E5FF1A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] animate-grid-flow opacity-20" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-10 rounded-2xl border border-white/10 w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
        >
          <div className="w-20 h-20 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,229,255,0.3)]">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">System Locked</h1>
          <p className="text-gray-400 mb-8 text-sm">Clearance required for internal portal access.</p>
          <button 
            onClick={handleLogin} 
            className="w-full bg-cyan-600/80 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] border border-cyan-400/50"
          >
            Authenticate
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: "operations", label: "Operations", icon: <Utensils className="w-4 h-4" /> },
    { id: "performers", label: "Performers", icon: <Users className="w-4 h-4" /> },
    { id: "treasury", label: "Treasury", icon: <IndianRupee className="w-4 h-4" />, adminOnly: true },
    { id: "manage_admins", label: "Security", icon: <ShieldAlert className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isMasterAdmin);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      <header className="bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-black glow-cyan text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#00E5FF] tracking-tighter">
              SPARKZ ADMIN
            </h1>
            <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin/scanner" className="bg-purple-600/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-colors border border-purple-500/30 shadow-[0_0_15px_rgba(176,38,255,0.2)]">
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Scanner</span>
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors p-2 bg-white/5 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex px-4 max-w-7xl mx-auto overflow-x-auto hide-scrollbar border-t border-white/5">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative px-6 py-4 text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 ${
                activeTab === t.id ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2 relative z-10">
                {t.icon}
                <span>{t.label}</span>
              </div>
              {activeTab === t.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.8)]" 
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === "treasury" && isMasterAdmin && (
              <motion.div 
                key="treasury"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/60 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                    <p className="text-cyan-400/80 font-bold uppercase tracking-widest text-xs mb-2">Estimated Collected (Batch '28)</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter">₹{totalCollected.toLocaleString()}</h2>
                  </div>
                  <div className="glass border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/60 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                    <p className="text-purple-400/80 font-bold uppercase tracking-widest text-xs mb-2">Total Disbursed</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter">₹{totalDisbursed.toLocaleString()}</h2>
                  </div>
                </div>

                <div className="glass border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 bg-white/5">
                    <h3 className="text-xl font-bold text-white tracking-tight">Pending Disbursements</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-widest bg-black/40 border-b border-white/10">
                          <th className="p-4 font-bold">Team Lead</th>
                          <th className="p-4 font-bold">Purpose</th>
                          <th className="p-4 font-bold">Amount</th>
                          <th className="p-4 font-bold">UPI ID</th>
                          <th className="p-4 font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disbursements.filter(d => d.status === "pending").map((d, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: i * 0.05 }}
                            key={d.id} 
                            className="border-b border-white/5 text-gray-200 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-4 font-medium">{d.team_lead_name}</td>
                            <td className="p-4">{d.purpose}</td>
                            <td className="p-4 font-mono text-cyan-400 font-bold">₹{d.amount}</td>
                            <td className="p-4 font-mono text-sm">{d.upi_id}</td>
                            <td className="p-4">
                              <div className="flex flex-col space-y-3">
                                <a
                                  href={`upi://pay?pa=${d.upi_id}&pn=${encodeURIComponent(d.purpose)}&am=${d.amount}&cu=INR`}
                                  className="bg-purple-600/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-center text-xs font-bold py-2 px-4 rounded-lg transition-all"
                                >
                                  Approve via UPI
                                </a>
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    placeholder="UTR Number"
                                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500"
                                    value={utrInput[d.id] || ""}
                                    onChange={(e) => setUtrInput({ ...utrInput, [d.id]: e.target.value })}
                                  />
                                  <button
                                    onClick={() => markDisbursed(d.id)}
                                    className="bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 px-3 rounded-lg text-xs font-bold transition-all"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {disbursements.filter(d => d.status === "pending").length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                                <span>No pending disbursements</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "manage_admins" && isMasterAdmin && (
              <motion.div 
                key="manage_admins"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass border border-red-500/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                  <div className="p-6 border-b border-white/10 bg-red-500/5">
                    <h3 className="text-xl font-bold text-red-400 mb-1 flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5" />
                      <span>Security Controls</span>
                    </h3>
                    <p className="text-sm text-gray-400">Authorize elevated personnel access to the scanner and operations view.</p>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-10">
                      <input
                        type="email"
                        required
                        placeholder="Enter agent email address"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="flex-grow bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder:text-gray-600"
                      />
                      <button type="submit" className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] whitespace-nowrap">
                        Grant Access
                      </button>
                    </form>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Authorized Personnel</h4>
                      {adminEmails.map((email, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.05 }}
                          key={email} 
                          className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded-xl group hover:bg-white/5 transition-colors"
                        >
                          <span className="text-gray-200 font-medium">{email}</span>
                          <button onClick={() => handleRemoveAdmin(email)} className="text-gray-500 hover:text-red-400 p-2 transition-colors bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                      {adminEmails.length === 0 && (
                        <p className="text-gray-500 text-sm italic">No personnel records found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "operations" && (
              <motion.div 
                key="operations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto sm:mx-0"
              >
                <div className="glass border border-yellow-500/30 p-8 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full pointer-events-none" />
                  <h3 className="text-2xl font-black text-white mb-8 tracking-tight">Kitchen Matrix</h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-gray-400 font-medium uppercase tracking-widest text-xs">Vegetarian</span>
                        <span className="text-3xl font-black text-green-400 glow-cyan">{vegCount}</span>
                      </div>
                      <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(vegCount / Math.max(vegCount + nonVegCount, 1)) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-gray-400 font-medium uppercase tracking-widest text-xs">Non-Vegetarian</span>
                        <span className="text-3xl font-black text-red-400">{nonVegCount}</span>
                      </div>
                      <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(nonVegCount / Math.max(vegCount + nonVegCount, 1)) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]" 
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="text-gray-300 font-bold">Total Plates Required</span>
                        <span className="text-2xl font-black text-yellow-400">{vegCount + nonVegCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "performers" && (
              <motion.div 
                key="performers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="glass border border-purple-500/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(176,38,255,0.1)]">
                  <div className="p-6 border-b border-white/10 bg-purple-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-xl font-bold text-white tracking-tight">Talent Roster</h3>
                    <span className="bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-500/40 shadow-[0_0_15px_rgba(176,38,255,0.3)]">
                      {performers.length} Active Profiles
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-widest bg-black/40 border-b border-white/10">
                          <th className="p-5 font-bold">Performer Name</th>
                          <th className="p-5 font-bold">Roll Number</th>
                          <th className="p-5 font-bold">Category</th>
                          <th className="p-5 font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performers.map((p, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            className="border-b border-white/5 text-gray-200 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-5 font-bold">{p.name}</td>
                            <td className="p-5 font-mono text-cyan-400/80">{p.roll_number}</td>
                            <td className="p-5">
                              <span className="bg-black/50 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10">
                                {p.talent_category}
                              </span>
                            </td>
                            <td className="p-5">
                              <button
                                onClick={() => exportPDF(p)}
                                className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-lg border border-cyan-500/30"
                              >
                                <FileDown className="w-4 h-4" />
                                <span className="text-sm font-bold">Extract</span>
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                        {performers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <Users className="w-8 h-8 mb-2 opacity-50" />
                                <span>No talent profiles detected</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
