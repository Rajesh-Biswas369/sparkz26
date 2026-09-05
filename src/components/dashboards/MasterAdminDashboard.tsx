"use client";

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { LogOut, Users, Star, QrCode, Wallet, FileText } from 'lucide-react';
import QRScanner from './QRScanner';
import StudentRecords from '../shared/StudentRecords';
import CulturalParticipations from '../shared/CulturalParticipations';
import MasterPaymentRequests from '../shared/MasterPaymentRequests';
import MasterAbsenceRequests from '../shared/MasterAbsenceRequests';
import ExpenseBreakdownModal from '../shared/ExpenseBreakdownModal';

interface MasterAdminDashboardProps {
  userData: any;
}

export default function MasterAdminDashboard({ userData }: MasterAdminDashboardProps) {
  const [onlineCollected, setOnlineCollected] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [completedExpensesList, setCompletedExpensesList] = useState<any[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'students' | 'participations' | 'scanner' | 'payment_requests' | 'absence_requests'>('students');
  const [pendingCount, setPendingCount] = useState(0);
  const [hasViewedPayments, setHasViewedPayments] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "treasury", "master_ledger"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setOnlineCollected(data.online_collected || 0);
        setCashCollected(data.cash_collected || 0);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    const qPending = query(
      collection(db, "payment_requests"),
      where("status", "==", "PENDING_MASTER")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubPending();
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

  const totalExpenses = completedExpensesList.reduce((sum, req) => sum + (req.amount || 0), 0);
  const grandTotal = (onlineCollected + cashCollected) - totalExpenses;

  useEffect(() => {
    if (activeTab === 'payment_requests' && !hasViewedPayments) {
      setHasViewedPayments(true);
    }
  }, [activeTab, hasViewedPayments]);

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
    <div className="w-full min-h-screen flex flex-col relative z-10 pt-4 md:pt-10 px-4 md:px-8 pb-40 max-w-7xl mx-auto overflow-visible">
      
      {/* Top Profile Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-[#00E5FF]/30 p-5 rounded-2xl mb-8 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="w-14 h-14 rounded-full border-2 border-[#00E5FF] flex items-center justify-center text-xl font-['Orbitron',sans-serif] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.5)]">
            {(userData?.profile_image_url || auth?.currentUser?.photoURL) ? (
              <img src={userData?.profile_image_url || auth?.currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              userData?.name?.charAt(0) || "M"
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row items-center">
              <h2 className="text-xl font-bold font-['Orbitron',sans-serif] text-white uppercase">
                {userData?.name || "Master Admin"}
              </h2>
              <span className="ml-3 px-2 py-0.5 text-[10px] border border-[#00E5FF] text-[#00E5FF] rounded bg-[#00E5FF]/10 font-['Orbitron',sans-serif] tracking-widest shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-sm text-gray-400 font-['Inter',sans-serif] mt-1">
              {userData?.email || "master@sparkz.com"}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(220,38,38,0.3)] font-['Orbitron',sans-serif] text-sm uppercase tracking-widest"
          style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Layout Structure */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 mb-16 relative h-auto">
        
        {/* Left Column: Vertical Navigation Panel */}
        <div className="w-full lg:w-2/12 relative h-auto flex flex-col gap-3 p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <h3 className="font-['Orbitron',sans-serif] text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">Menu</h3>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'students' ? 'bg-[#00E5FF]/10 border-l-4 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="truncate">Students</span>
          </button>
          <button
            onClick={() => setActiveTab('participations')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'participations' ? 'bg-[#00E5FF]/10 border-l-4 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Star className="w-5 h-5 shrink-0" />
            <span className="truncate">Participations</span>
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'scanner' ? 'bg-[#00E5FF]/10 border-l-4 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <QrCode className="w-5 h-5 shrink-0" />
            <span className="truncate">QR Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('payment_requests')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'payment_requests' ? 'bg-[#E07020]/10 border-l-4 border-[#E07020] text-[#E07020] shadow-[0_0_15px_rgba(224,112,32,0.2)]' : 'text-gray-400 hover:text-[#E07020] hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span className="truncate">Payment Requests</span>
            {pendingCount > 0 && !hasViewedPayments && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('absence_requests')}
            className={`w-full relative flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'absence_requests' ? 'bg-[#00E5FF]/10 border-l-4 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span className="truncate">Absence Requests</span>
          </button>
        </div>

        {/* Center Column: Dynamic Content Area */}
        <div className="w-full lg:w-8/12 relative z-20 h-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] min-h-[400px]">
          {activeTab === 'students' && <StudentRecords />}
          {activeTab === 'participations' && <CulturalParticipations />}
          {activeTab === 'scanner' && <QRScanner />}
          {activeTab === 'payment_requests' && <MasterPaymentRequests />}
          {activeTab === 'absence_requests' && <MasterAbsenceRequests />}
        </div>

        {/* Right Column: Mini Analytics / Action Panel */}
        <div className="w-full lg:w-2/12 relative z-0 h-auto bg-black/40 backdrop-blur-md border border-[#E07020]/30 rounded-xl p-5 shadow-[0_0_15px_rgba(224,112,32,0.15)]">
          <h2 className="font-['Orbitron',sans-serif] text-sm text-white tracking-widest uppercase mb-4 flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[#E07020] shadow-[0_0_8px_#E07020] rotate-45"></div>
            <span>Treasury Status</span>
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-3">
              <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Total Online</span>
              <span className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                ₹{onlineCollected}
              </span>
            </div>

            <div className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-3">
              <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Total Cash</span>
              <span className="font-['Orbitron',sans-serif] text-xl font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                ₹{cashCollected}
              </span>
            </div>

            <div className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Total Expenses</span>
                <button onClick={() => setIsExpenseModalOpen(true)} className="w-4 h-4 rounded-full border border-gray-400 text-gray-400 hover:text-[#00E5FF] hover:border-[#00E5FF] flex items-center justify-center text-[10px] transition-colors" title="View Expense Breakdown">?</button>
              </div>
              <span className="text-red-500 font-['Orbitron',sans-serif] text-xl font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                -₹{totalExpenses}
              </span>
            </div>

            <div className="flex flex-col bg-white/5 border border-[#E07020]/30 rounded-lg p-3 shadow-[0_0_10px_rgba(224,112,32,0.1)]">
              <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">Grand Total</span>
              <span className="font-['Orbitron',sans-serif] text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
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
