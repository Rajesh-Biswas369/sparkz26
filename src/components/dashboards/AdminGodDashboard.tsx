"use client";

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { LogOut, Users, Star, Settings, DollarSign, FileText, AlertTriangle, CheckCircle, ShieldAlert, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentRecords from '../shared/StudentRecords';
import CulturalParticipations from '../shared/CulturalParticipations';
import AdminGodPaymentRequests from '../shared/AdminGodPaymentRequests';
import ExpenseBreakdownModal from '../shared/ExpenseBreakdownModal';
import MasterAbsenceRequests from '../shared/MasterAbsenceRequests';
import AdminGodPermitEdit from '../shared/AdminGodPermitEdit';
import AdminGodRegistrationPermit from '../shared/AdminGodRegistrationPermit';
import LogisticsStats from '../shared/LogisticsStats';
import Contributors from '../shared/Contributors';
import ContributionAnalysis from '../shared/ContributionAnalysis';
import { Wallet, Edit2, ClipboardList, UserPlus, BarChart3 } from 'lucide-react';

interface AdminGodDashboardProps {
  userData?: any;
}

export default function AdminGodDashboard({ userData }: AdminGodDashboardProps) {
  const [onlineCollected, setOnlineCollected] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [completedExpensesList, setCompletedExpensesList] = useState<any[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [inputOnline, setInputOnline] = useState("");
  const [inputCash, setInputCash] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'students' | 'participations' | 'settings' | 'payment_requests' | 'absence_requests' | 'permit_edit' | 'registration_permit' | 'logistics' | 'contributors' | 'contribution_analysis' | 'god_mode'>('settings');
  const [pendingCount, setPendingCount] = useState(0);
  const [hasViewedPayments, setHasViewedPayments] = useState(false);

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

  const [scannerControls, setScannerControls] = useState({
    allow_entry: false,
    allow_tshirt: false,
    allow_breakfast: false,
    allow_lunch: false,
    allow_registration_edit: false,
    allow_event_registration_edit: false,
    allow_registration: false,
    allow_event_registration: false
  });

  useEffect(() => {
    if (!db) return;

    const unsubTreasury = onSnapshot(doc(db, "treasury", "master_ledger"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setOnlineCollected(data.online_collected || 0);
        setCashCollected(data.cash_collected || 0);
      }
    });

    const unsubControls = onSnapshot(doc(db, "settings", "scanner_controls"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setScannerControls({
          allow_entry: !!data.allow_entry,
          allow_tshirt: !!data.allow_tshirt,
          allow_breakfast: !!data.allow_breakfast,
          allow_lunch: !!data.allow_lunch,
          allow_registration_edit: !!data.allow_registration_edit,
          allow_event_registration_edit: !!data.allow_event_registration_edit,
          allow_registration: !!data.allow_registration,
          allow_event_registration: !!data.allow_event_registration
        });
      }
    });

    return () => {
      unsubTreasury();
      unsubControls();
    };
  }, []);

  useEffect(() => {
    const qExpenses = query(
      collection(db, "payment_requests"),
      where("status", "==", "COMPLETED")
    );
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedExpensesList(expenses);
    });

    return () => unsubExpenses();
  }, []);

  const totalExpenses = completedExpensesList.reduce((sum, req) => sum + (Number(req.amount) || 0), 0);
  const grandTotal = (onlineCollected + cashCollected) - totalExpenses;

  useEffect(() => {
    const qPending = query(
      collection(db, "payment_requests"),
      where("status", "==", "PENDING_GOD")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubPending();
  }, []);

  useEffect(() => {
    if (activeTab === 'payment_requests' && !hasViewedPayments) {
      setHasViewedPayments(true);
    }
  }, [activeTab, hasViewedPayments]);

  const handleUpdateTreasury = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "treasury", "master_ledger"), {
        online_collected: inputOnline !== "" ? Number(inputOnline) : onlineCollected,
        cash_collected: inputCash !== "" ? Number(inputCash) : cashCollected,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setInputOnline("");
      setInputCash("");
    } catch (error) {
      console.error("Error updating ledger:", error);
    }
    setLoading(false);
  };

  const toggleControl = async (field: keyof typeof scannerControls) => {
    try {
      const currentValue = scannerControls[field];
      await setDoc(doc(db, "settings", "scanner_controls"), {
        [field]: !currentValue
      }, { merge: true });
    } catch (err) {
      console.error("Error toggling control", err);
    }
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
      
    } catch (err) {
      console.error(err);
      showToast("Bulk update failed.", "error");
    } finally {
      setBulkUpdating(false);
    }
  };

  useEffect(() => {
    if (!db || activeTab !== 'god_mode') return;

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("admin_role");
      window.location.href = '/login';
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col relative z-10 pt-4 md:pt-10 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      
      {/* Top Profile Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between bg-black/60 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,0,0,0.15)] mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex items-center space-x-6 mb-6 md:mb-0 z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-red-500 overflow-hidden shadow-[0_0_15px_#ef4444] flex items-center justify-center bg-gray-900">
            {(userData?.profile_image_url || auth?.currentUser?.photoURL) ? (
              <img src={userData?.profile_image_url || auth?.currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-['Orbitron',sans-serif] text-2xl text-red-500 uppercase">
                {userData?.name?.charAt(0) || "G"}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-4">
              <h2 className="font-['Orbitron',sans-serif] text-xl md:text-2xl font-bold text-white tracking-widest uppercase">
                {userData?.name || "Admin God"}
              </h2>
              <span className="border border-red-500 text-red-500 text-xs px-2 py-1 rounded tracking-widest font-['Orbitron',sans-serif] shadow-[0_0_8px_rgba(239,68,68,0.4)] bg-red-500/10">
                ADMIN GOD
              </span>
            </div>
            <p className="font-['Inter',sans-serif] text-sm text-gray-400 mt-1">
              {userData?.email || "god@sparkz.com"}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.3)] font-['Orbitron',sans-serif] text-sm uppercase tracking-widest z-10"
          style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
        
        {/* Left Column: Vertical Navigation Panel */}
        <div className="lg:col-span-2 h-fit flex flex-col gap-3 p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] lg:sticky lg:top-24">
          <h3 className="font-['Orbitron',sans-serif] text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">God Menu</h3>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'students' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="truncate">Students</span>
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'logistics' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            <span className="truncate">Logistics</span>
          </button>
          <button
            onClick={() => setActiveTab('participations')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'participations' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Star className="w-5 h-5 shrink-0" />
            <span className="truncate">Participations</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'settings' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="truncate">Global Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('payment_requests')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'payment_requests' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span className="truncate">Payment Requests</span>
            {pendingCount > 0 && !hasViewedPayments && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('absence_requests')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'absence_requests' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span className="truncate">Absence Requests</span>
          </button>
          <button
            onClick={() => setActiveTab('permit_edit')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'permit_edit' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Edit2 className="w-5 h-5 shrink-0" />
            <span className="truncate">Permit Edit</span>
          </button>
          <button
            onClick={() => setActiveTab('registration_permit')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'registration_permit' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <UserPlus className="w-5 h-5 shrink-0" />
            <span className="truncate">Registration Permit</span>
          </button>
          <button
            onClick={() => setActiveTab('contributors')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'contributors' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="truncate">Contributors</span>
          </button>
          <button
            onClick={() => setActiveTab('contribution_analysis')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'contribution_analysis' ? 'bg-red-500/10 border-l-4 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-500 hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span className="truncate">Contrib Analysis</span>
          </button>
          
          <button
            onClick={() => setActiveTab('god_mode')}
            className={`w-full mt-4 flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider border-l-4 ${activeTab === 'god_mode' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-red-500/50 hover:text-red-500 hover:bg-red-500/10 border-transparent hover:border-red-500/50'}`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="truncate">GOD MODE</span>
          </button>
        </div>

        {/* Center Column: Dynamic Content Area */}
        <div className="lg:col-span-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] min-h-[400px]">
          {activeTab === 'students' && <StudentRecords isAdminGod={true} />}
          {activeTab === 'logistics' && <LogisticsStats />}
          {activeTab === 'participations' && <CulturalParticipations />}
          {activeTab === 'payment_requests' && <AdminGodPaymentRequests />}
          {activeTab === 'absence_requests' && <MasterAbsenceRequests />}
          {activeTab === 'permit_edit' && (
            <AdminGodPermitEdit 
              allowEdit={scannerControls.allow_registration_edit} 
              onToggle={() => toggleControl('allow_registration_edit')}
              allowEventEdit={scannerControls.allow_event_registration_edit}
              onToggleEventEdit={() => toggleControl('allow_event_registration_edit')}
            />
          )}
          {activeTab === 'registration_permit' && (
            <AdminGodRegistrationPermit 
              allowRegistration={scannerControls.allow_registration} 
              onToggle={() => toggleControl('allow_registration')}
              allowEventRegistration={scannerControls.allow_event_registration}
              onToggleEventRegistration={() => toggleControl('allow_event_registration')}
            />
          )}
          {activeTab === 'contributors' && <Contributors isAdminGod={true} />}
          {activeTab === 'contribution_analysis' && <ContributionAnalysis />}
          
          {activeTab === 'settings' && (
            <div className="flex flex-col h-full">
              <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <Settings className="text-red-500" />
                Global Scanner Controls
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(scannerControls)
                  .filter(([key]) => key !== 'allow_registration_edit' && key !== 'allow_registration' && key !== 'allow_event_registration' && key !== 'allow_event_registration_edit')
                  .map(([key, value]) => {
                  const label = key.replace("allow_", "").toUpperCase();
                  return (
                    <button
                      key={key}
                      onClick={() => toggleControl(key as keyof typeof scannerControls)}
                      className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-300 ${value ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'bg-red-500/5 border-red-500/30 opacity-60 hover:opacity-100 hover:border-red-500/60'}`}
                    >
                      <span className={`font-['Orbitron',sans-serif] font-bold tracking-widest mb-2 ${value ? 'text-green-400' : 'text-red-400'}`}>
                        {label}
                      </span>
                      <span className={`font-['Inter',sans-serif] text-xs uppercase tracking-wider ${value ? 'text-green-500/80' : 'text-red-500/80'}`}>
                        {value ? 'ENABLED' : 'LOCKED'}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-8 text-sm text-gray-500 font-['Inter',sans-serif] text-center bg-white/5 p-4 rounded-lg border border-white/10">
                Toggling these switches will instantly lock or unlock the action buttons on all volunteer QR Scanners globally via Firestore sync.
              </p>
            </div>
          )}

          {activeTab === 'god_mode' && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300">
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
            </div>
          )}
        </div>

        {/* Right Column: Treasury Command */}
        <div className="lg:col-span-2 h-fit bg-black/40 backdrop-blur-md border border-[#E07020]/30 rounded-xl p-5 shadow-[0_0_20px_rgba(224,112,32,0.15)] relative overflow-hidden lg:sticky lg:top-24">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E07020]/10 rounded-full blur-[50px] pointer-events-none"></div>
          
          <h2 className="font-['Orbitron',sans-serif] text-sm text-[#E07020] tracking-widest uppercase mb-6 flex items-center space-x-2 relative z-10">
            <DollarSign size={16} />
            <span>Treasury Command</span>
          </h2>
          
          <div className="flex flex-col gap-5 relative z-10">
            <div className="flex flex-col">
              <label className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Set Online Total</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-['Orbitron',sans-serif] focus:outline-none focus:border-[#E07020] transition-colors"
                  placeholder={onlineCollected.toString()}
                  value={inputOnline}
                  onChange={(e) => setInputOnline(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Set Cash Total</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-['Orbitron',sans-serif] focus:outline-none focus:border-[#E07020] transition-colors"
                  placeholder={cashCollected.toString()}
                  value={inputCash}
                  onChange={(e) => setInputCash(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleUpdateTreasury}
              disabled={loading || (!inputOnline && !inputCash)}
              className="w-full py-3 bg-[#E07020]/20 text-[#E07020] border border-[#E07020]/50 hover:bg-[#E07020] hover:text-black font-['Orbitron',sans-serif] font-bold text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 mt-2"
              style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0% 100%)" }}
            >
              {loading ? "..." : "Update"}
            </button>

            <div className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Total Expenses</span>
                <button onClick={() => setIsExpenseModalOpen(true)} className="w-4 h-4 rounded-full border border-gray-400 text-gray-400 hover:text-red-500 hover:border-red-500 flex items-center justify-center text-[10px] transition-colors" title="View Expense Breakdown">?</button>
              </div>
              <span className="text-red-500 font-['Orbitron',sans-serif] text-xl font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                -₹{totalExpenses}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1 block">Grand Total</span>
              <span className="font-['Orbitron',sans-serif] text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#E07020] drop-shadow-[0_0_10px_rgba(224,112,32,0.5)]">
                ₹{grandTotal}
              </span>
            </div>
          </div>
        </div>

      </div>

      <ExpenseBreakdownModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenses={completedExpensesList}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-4 left-1/2 z-[60] flex items-center gap-2 px-6 py-3 rounded-full border shadow-2xl font-bold uppercase tracking-wider ${
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
                WARNING: You are about to overwrite <strong className="text-white uppercase">{modalConfig.field.replace('_scanned', '')}</strong> status to <strong className={modalConfig.isAll ? "text-green-400" : "text-red-400"}>{modalConfig.isAll ? "ALL" : "NONE"}</strong> for ALL appeared students. This will erase manual scan data. Type &apos;CONFIRM&apos; to proceed.
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
    </div>
  );
}
