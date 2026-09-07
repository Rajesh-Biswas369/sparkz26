"use client";

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { LogOut, Users, Star, Settings, DollarSign, FileText } from 'lucide-react';
import StudentRecords from '../shared/StudentRecords';
import CulturalParticipations from '../shared/CulturalParticipations';
import AdminGodPaymentRequests from '../shared/AdminGodPaymentRequests';
import ExpenseBreakdownModal from '../shared/ExpenseBreakdownModal';
import MasterAbsenceRequests from '../shared/MasterAbsenceRequests';
import AdminGodPermitEdit from '../shared/AdminGodPermitEdit';
import { Wallet, Edit2 } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'students' | 'participations' | 'settings' | 'payment_requests' | 'absence_requests' | 'permit_edit'>('settings');
  const [pendingCount, setPendingCount] = useState(0);
  const [hasViewedPayments, setHasViewedPayments] = useState(false);

  const [scannerControls, setScannerControls] = useState({
    allow_entry: false,
    allow_tshirt: false,
    allow_breakfast: false,
    allow_lunch: false,
    allow_registration_edit: false
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
          allow_registration_edit: !!data.allow_registration_edit
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
        </div>

        {/* Center Column: Dynamic Content Area */}
        <div className="lg:col-span-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] min-h-[400px]">
          {activeTab === 'students' && <StudentRecords />}
          {activeTab === 'participations' && <CulturalParticipations />}
          {activeTab === 'payment_requests' && <AdminGodPaymentRequests />}
          {activeTab === 'absence_requests' && <MasterAbsenceRequests />}
          {activeTab === 'permit_edit' && (
            <AdminGodPermitEdit 
              allowEdit={scannerControls.allow_registration_edit} 
              onToggle={() => toggleControl('allow_registration_edit')}
            />
          )}
          
          {activeTab === 'settings' && (
            <div className="flex flex-col h-full">
              <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <Settings className="text-red-500" />
                Global Scanner Controls
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(scannerControls)
                  .filter(([key]) => key !== 'allow_registration_edit')
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
    </div>
  );
}
