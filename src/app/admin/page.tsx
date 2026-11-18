"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, setDoc, deleteDoc, getDoc, writeBatch } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, CheckCircle, IndianRupee, Utensils, Users, Search, Lock, ShieldAlert, LogOut, Trash2, Loader2, ChevronRight, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

type Tab = "operations" | "performers" | "treasury" | "manage_admins" | "god_mode";

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

  // God Mode Data
  const [godModeActive, setGodModeActive] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; field: string; isAll: boolean } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Mass Cancellation Data
  const [massCancelModalOpen, setMassCancelModalOpen] = useState(false);
  const [massCancelConfirmText, setMassCancelConfirmText] = useState("");
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [revertConfirmText, setRevertConfirmText] = useState("");
  const [massCancelling, setMassCancelling] = useState(false);
  const [unappearedCount, setUnappearedCount] = useState<number | null>(null);
  const [massCancelledCount, setMassCancelledCount] = useState<number | null>(null);

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

  const showToast = (msg: string, type: "success" | "error") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const executeBulkUpdate = async () => {
    if (!modalConfig || !db) return;
    setBulkUpdating(true);
    try {
      const { field, isAll } = modalConfig;
      const q = query(collection(db, "users"), where("entry_scanned", "==", true));
      const snap = await getDocs(q);
      const docs = snap.docs;
      
      const chunks = [];
      for (let i = 0; i < docs.length; i += 400) {
        chunks.push(docs.slice(i, i + 400));
      }

      await Promise.all(chunks.map(async (chunk) => {
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          batch.update(d.ref, { [field]: isAll });
        });
        await batch.commit();
      }));

      showToast(`Bulk update successful: ${field.replace('_scanned', '')} set to ${isAll ? 'ALL' : 'NONE'}`, "success");
      setModalConfig(null);
      setConfirmText("");
      
      // Refresh operations data
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
      await fetchOperations();

    } catch (err) {
      console.error(err);
      showToast("Bulk update failed.", "error");
    } finally {
      setBulkUpdating(false);
    }
  };

  useEffect(() => {
    if (!db || activeTab !== "god_mode") return;

    const q = query(collection(db, "users"), where("batch", "==", "29"));
    const unsub = onSnapshot(q, (snapshot) => {
      let unappeared = 0;
      let cancelled = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const isAppeared = data.entry_scanned === true;
        const isConfirmedAbsent = data.absence_status === 'confirmed';
        if (!isAppeared && !isConfirmedAbsent) {
          unappeared++;
        }
        if (data.qr_cancelled) {
          cancelled++;
        }
      });
      setUnappearedCount(unappeared);
      setMassCancelledCount(cancelled);
    });

    return () => unsub();
  }, [activeTab]);

  const executeMassCancel = async () => {
    if (!db) return;
    setMassCancelling(true);
    try {
      const q = query(collection(db, "users"), where("batch", "==", "29"));
      const snap = await getDocs(q);

      const targetDocs = snap.docs.filter((d) => {
        const data = d.data();
        const isAppeared = data.entry_scanned === true;
        const isConfirmedAbsent = data.absence_status === 'confirmed';
        return !isAppeared && !isConfirmedAbsent;
      });

      if (targetDocs.length === 0) {
        showToast("No eligible unappeared students found.", "error");
        setMassCancelModalOpen(false);
        setMassCancelConfirmText("");
        return;
      }

      const chunks = [];
      for (let i = 0; i < targetDocs.length; i += 400) {
        chunks.push(targetDocs.slice(i, i + 400));
      }

      await Promise.all(chunks.map(async (chunk) => {
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          batch.update(d.ref, {
            qr_cancelled: true,
            cancel_reason: "Neither Appeared nor submit absence request",
            entry_cancelled: true,
            breakfast_cancelled: true,
            lunch_cancelled: true,
            tshirt_cancelled: true,
            is_absent: true,
            cancelled_at: new Date().toISOString()
          });
        });
        await batch.commit();
      }));

      showToast(`Cancelled QR & 4 icons for ${targetDocs.length} unappeared students!`, "success");
      setMassCancelModalOpen(false);
      setMassCancelConfirmText("");
    } catch (err) {
      console.error("Error executing mass cancellation", err);
      showToast("Mass cancellation failed.", "error");
    } finally {
      setMassCancelling(false);
    }
  };

  const executeRevertCancel = async () => {
    if (!db) return;
    setMassCancelling(true);
    try {
      const q = query(collection(db, "users"), where("batch", "==", "29"));
      const snap = await getDocs(q);

      const targetDocs = snap.docs.filter((d) => {
        const data = d.data();
        return data.qr_cancelled === true && data.cancel_reason === "Neither Appeared nor submit absence request";
      });

      if (targetDocs.length === 0) {
        showToast("No mass-cancelled students to restore.", "error");
        setRevertModalOpen(false);
        setRevertConfirmText("");
        return;
      }

      const chunks = [];
      for (let i = 0; i < targetDocs.length; i += 400) {
        chunks.push(targetDocs.slice(i, i + 400));
      }

      await Promise.all(chunks.map(async (chunk) => {
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          const data = d.data();
          batch.update(d.ref, {
            qr_cancelled: false,
            cancel_reason: null,
            entry_cancelled: false,
            breakfast_cancelled: false,
            lunch_cancelled: false,
            tshirt_cancelled: false,
            is_absent: data.absence_status === 'confirmed'
          });
        });
        await batch.commit();
      }));

      showToast(`Restored passes for ${targetDocs.length} students!`, "success");
      setRevertModalOpen(false);
      setRevertConfirmText("");
    } catch (err) {
      console.error("Error reverting mass cancellation", err);
      showToast("Revert failed.", "error");
    } finally {
      setMassCancelling(false);
    }
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean; isGod?: boolean }[] = [
    { id: "operations", label: "Operations", icon: <Utensils className="w-4 h-4" /> },
    { id: "performers", label: "Performers", icon: <Users className="w-4 h-4" /> },
    { id: "treasury", label: "Treasury", icon: <IndianRupee className="w-4 h-4" />, adminOnly: true },
    { id: "manage_admins", label: "Security", icon: <ShieldAlert className="w-4 h-4" />, adminOnly: true },
    { id: "god_mode", label: "GOD MODE", icon: <AlertTriangle className="w-4 h-4" />, isGod: true },
  ];

  const visibleTabs = tabs.filter(t => (t.isGod ? isMasterAdmin : (!t.adminOnly || isMasterAdmin)));

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
                activeTab === t.id ? (t.id === "god_mode" ? "text-red-400" : "text-cyan-400") : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2 relative z-10">
                {t.icon}
                <span>{t.label}</span>
              </div>
              {activeTab === t.id && (
                <motion.div 
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${t.id === "god_mode" ? "bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.8)]"}`} 
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-6 py-3 rounded-full border shadow-2xl font-bold uppercase tracking-wider ${
                toastMessage.type === "success" 
                  ? "bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  : "bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              }`}
            >
              {toastMessage.type === "success" ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              {toastMessage.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* God Mode Modal */}
        <AnimatePresence>
          {modalConfig?.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0a0a0a] border-2 border-red-600 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.4)]"
              >
                <div className="flex items-center space-x-3 mb-6 text-red-500">
                  <AlertTriangle className="w-8 h-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">Critical Warning</h2>
                </div>
                <p className="text-gray-300 font-medium mb-6 leading-relaxed">
                  WARNING: You are about to overwrite <strong className="text-white uppercase">{modalConfig.field.replace('_scanned', '')}</strong> status to <strong className={modalConfig.isAll ? "text-green-400" : "text-red-400"}>{modalConfig.isAll ? "ALL" : "NONE"}</strong> for ALL appeared students. This will erase manual scan data. Type 'CONFIRM' to proceed.
                </p>
                <div className="mb-6">
                  <input 
                    type="text" 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full bg-black border border-red-500/50 rounded-xl px-4 py-3 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-gray-700 uppercase"
                    placeholder="CONFIRM"
                  />
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      setModalConfig(null);
                      setConfirmText("");
                    }}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeBulkUpdate}
                    disabled={confirmText !== "CONFIRM" || bulkUpdating}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center"
                  >
                    {bulkUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Execute"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mass Cancel Modal */}
        <AnimatePresence>
          {massCancelModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0a0a0a] border-2 border-red-600 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.5)]"
              >
                <div className="flex items-center space-x-3 mb-6 text-red-500">
                  <AlertTriangle className="w-8 h-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">Mass Cancel Passes & Perks</h2>
                </div>
                <div className="text-gray-300 font-medium mb-6 text-sm leading-relaxed space-y-3">
                  <p>
                    You are about to cancel the Digital Entry Pass (QR Code) and all 4 perks (<strong className="text-white">Entry, Breakfast, Lunch, T-Shirt</strong>) for mass students who:
                  </p>
                  <ul className="list-disc list-inside text-red-300 space-y-1 font-semibold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs">
                    <li>Did NOT appear (<code className="text-white">entry_scanned != true</code>)</li>
                    <li>Do NOT have a confirmed absence request (<code className="text-white">absence_status != &apos;confirmed&apos;</code>)</li>
                  </ul>
                  <p>
                    The QR code will be permanently stamped with:
                    <span className="block mt-1 font-mono text-xs bg-black p-2 rounded border border-red-500/40 text-red-400 font-bold">
                      Reason : Neither Appeared nor submit absence request
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Target students: <strong className="text-white">{unappearedCount !== null ? unappearedCount : 'calculating...'}</strong>
                  </p>
                  <p className="text-white font-bold text-xs uppercase tracking-wider">
                    Type &apos;CONFIRM&apos; below to execute:
                  </p>
                </div>
                <div className="mb-6">
                  <input 
                    type="text" 
                    value={massCancelConfirmText}
                    onChange={(e) => setMassCancelConfirmText(e.target.value)}
                    className="w-full bg-black border border-red-500/50 rounded-xl px-4 py-3 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-gray-700 uppercase"
                    placeholder="CONFIRM"
                  />
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      setMassCancelModalOpen(false);
                      setMassCancelConfirmText("");
                    }}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeMassCancel}
                    disabled={massCancelConfirmText !== "CONFIRM" || massCancelling}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2"
                  >
                    {massCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Execute Mass Cancel"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revert Modal */}
        <AnimatePresence>
          {revertModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0a0a0a] border-2 border-yellow-500/80 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(234,179,8,0.3)]"
              >
                <div className="flex items-center space-x-3 mb-6 text-yellow-400">
                  <AlertTriangle className="w-8 h-8" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">Revert Mass Cancelled Passes</h2>
                </div>
                <p className="text-gray-300 font-medium mb-6 text-sm leading-relaxed">
                  This will un-cancel the passes and perks for students previously cancelled with reason &apos;Neither Appeared nor submit absence request&apos;. Type &apos;CONFIRM&apos; to restore them.
                </p>
                <div className="mb-6">
                  <input 
                    type="text" 
                    value={revertConfirmText}
                    onChange={(e) => setRevertConfirmText(e.target.value)}
                    className="w-full bg-black border border-yellow-500/50 rounded-xl px-4 py-3 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-yellow-500 placeholder:text-gray-700 uppercase"
                    placeholder="CONFIRM"
                  />
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      setRevertModalOpen(false);
                      setRevertConfirmText("");
                    }}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeRevertCancel}
                    disabled={revertConfirmText !== "CONFIRM" || massCancelling}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2"
                  >
                    {massCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Execute Revert"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

            {activeTab === "god_mode" && isMasterAdmin && (
              <motion.div
                key="god_mode"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass border-2 border-red-500/50 p-8 rounded-2xl relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center space-x-4 mb-8 relative z-10">
                    <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">GOD MODE</h2>
                      <p className="text-red-400/80 font-bold uppercase tracking-widest text-xs">Danger Zone - Bulk Operations</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-black/40 border border-red-500/30 rounded-xl mb-8 relative z-10">
                    <div>
                      <h3 className="text-xl font-bold text-white">Activate God Mode</h3>
                      <p className="text-sm text-gray-400">Unlock destructive bulk actions.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={godModeActive} onChange={(e) => setGodModeActive(e.target.checked)} />
                      <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"></div>
                    </label>
                  </div>

                  <div className={`space-y-4 transition-opacity duration-300 relative z-10 ${godModeActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Bulk Overwrites (Target: Entry=True)</h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {[{label: 'Breakfast (None/All)', field: 'breakfast_scanned'}, {label: 'Lunch (None/All)', field: 'lunch_scanned'}, {label: 'T-Shirt (None/All)', field: 'tshirt_scanned'}].map(item => (
                        <div key={item.field} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border gap-4 ${godModeActive ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'bg-black/50 border-white/10'}`}>
                          <div>
                            <span className="font-bold text-white text-lg">{item.label}</span>
                          </div>
                          <div className="flex space-x-2 w-full sm:w-auto">
                            <button onClick={() => setModalConfig({isOpen: true, field: item.field, isAll: false})} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${godModeActive ? 'bg-black/50 text-red-400 border border-red-500/50 hover:bg-red-500/20' : 'bg-gray-800 text-gray-500'}`}>
                              None
                            </button>
                            <button onClick={() => setModalConfig({isOpen: true, field: item.field, isAll: true})} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${godModeActive ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-gray-800 text-gray-500'}`}>
                              All
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mass Cancellation for Unappeared Students */}
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pt-6 mb-4">
                      Mass Pass & Perks Cancellation (Unappeared & Unconfirmed)
                    </h4>

                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border gap-4 ${godModeActive ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'bg-black/50 border-white/10'}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-lg">Cancel QR & All 4 Icons</span>
                          {unappearedCount !== null && (
                            <span className="text-[10px] font-['Orbitron',sans-serif] px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 font-bold">
                              {unappearedCount} Unappeared Target{unappearedCount === 1 ? '' : 's'}
                            </span>
                          )}
                          {massCancelledCount !== null && massCancelledCount > 0 && (
                            <span className="text-[10px] font-['Orbitron',sans-serif] px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold">
                              {massCancelledCount} Already Cancelled
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 max-w-xl">
                          Cancels Digital Entry Pass (QR) and all 4 icons (Entry, Breakfast, Lunch, T-Shirt) for students who did not appear and have no confirmed absence request.
                          Reason stamped: <strong className="text-red-400 font-mono">Neither Appeared nor submit absence request</strong>.
                        </span>
                      </div>

                      <div className="flex space-x-2 w-full sm:w-auto">
                        {massCancelledCount !== null && massCancelledCount > 0 && (
                          <button
                            onClick={() => setRevertModalOpen(true)}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${godModeActive ? 'bg-black/50 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/20' : 'bg-gray-800 text-gray-500'}`}
                          >
                            Revert Passes
                          </button>
                        )}
                        <button
                          onClick={() => setMassCancelModalOpen(true)}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${godModeActive ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gray-800 text-gray-500'}`}
                        >
                          <XCircle size={15} />
                          Mass Cancel
                        </button>
                      </div>
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
