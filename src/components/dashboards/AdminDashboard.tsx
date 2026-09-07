"use client";

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { LogOut, Users, Star, QrCode, Wallet } from 'lucide-react';
import QRScanner from './QRScanner';
import StudentRecords from '../shared/StudentRecords';
import CulturalParticipations from '../shared/CulturalParticipations';
import PaymentRequests from '../shared/PaymentRequests';
import ExpenseBreakdownModal from '../shared/ExpenseBreakdownModal';

interface AdminDashboardProps {
  userData: any;
}

export default function AdminDashboard({ userData }: AdminDashboardProps) {
  const [onlineCollected, setOnlineCollected] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [completedExpensesList, setCompletedExpensesList] = useState<any[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'students' | 'participations' | 'scanner' | 'payment_requests'>('students');

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
      <div className="w-full flex flex-col md:flex-row items-center justify-between bg-black/60 backdrop-blur-md border border-[#00E5FF]/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,229,255,0.1)] mb-8">
        <div className="flex items-center space-x-6 mb-6 md:mb-0">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#00E5FF] overflow-hidden shadow-[0_0_15px_#00E5FF] flex items-center justify-center bg-gray-900">
            {(userData?.profile_image_url || auth?.currentUser?.photoURL) ? (
              <img src={userData?.profile_image_url || auth?.currentUser?.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-['Orbitron',sans-serif] text-2xl text-[#00E5FF] uppercase">
                {userData?.name?.charAt(0) || "A"}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-4">
              <h2 className="font-['Orbitron',sans-serif] text-xl md:text-2xl font-bold text-white tracking-widest uppercase">
                {userData?.name || "Admin"}
              </h2>
              <span className="border border-[#00E5FF] text-[#00E5FF] text-xs px-2 py-1 rounded tracking-widest font-['Orbitron',sans-serif] shadow-[0_0_8px_rgba(0,229,255,0.4)] bg-[#00E5FF]/10">
                ADMIN
              </span>
            </div>
            <p className="font-['Inter',sans-serif] text-sm text-gray-400 mt-1">
              {userData?.email || "admin@sparkz.com"}
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
        <div className="w-full lg:w-2/12 relative h-fit flex flex-col gap-3 p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] lg:sticky lg:top-24">
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
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-xs lg:text-sm font-['Orbitron',sans-serif] transition-all overflow-hidden uppercase tracking-wider ${activeTab === 'payment_requests' ? 'bg-[#00E5FF]/10 border-l-4 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 border-l-4 border-transparent'}`}
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span className="truncate">Payment Requests</span>
          </button>
        </div>

        {/* Center Column: Dynamic Content Area */}
        <div className="w-full lg:w-8/12 relative z-20 h-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] min-h-[400px]">
          {activeTab === 'students' && <StudentRecords />}
          {activeTab === 'participations' && <CulturalParticipations />}
          {activeTab === 'scanner' && <QRScanner />}
          {activeTab === 'payment_requests' && <PaymentRequests userData={userData} />}
        </div>

        {/* Right Column: Mini Analytics / Action Panel */}
        <div className="w-full lg:w-2/12 relative z-0 h-fit bg-black/40 backdrop-blur-md border border-[#00E5FF]/20 rounded-xl p-5 shadow-[0_0_15px_rgba(0,229,255,0.1)] lg:sticky lg:top-24">
          <h2 className="font-['Orbitron',sans-serif] text-sm text-white tracking-widest uppercase mb-4 flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] rotate-45"></div>
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

            <div className="flex flex-col bg-white/5 border border-[#00E5FF]/30 rounded-lg p-3 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
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
