"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Download, Search, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ContributorsProps {
  isAdminGod?: boolean;
}

export default function Contributors({ isAdminGod = false }: ContributorsProps) {
  const [contributors, setContributors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [activeSection, setActiveSection] = useState<'Sec A' | 'Sec B'>('Sec A');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showPopup, setShowPopup] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | null>(null);
  const [amountInput, setAmountInput] = useState<number | string>('');

  useEffect(() => {
    const q = query(collection(db, "contributors"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContributors(data);
    });
    return () => unsub();
  }, []);

  const filteredData = contributors.filter(c => {
    if (activeTab === 'Unpaid' && c.status !== 'unpaid') return false;
    if (activeTab === 'Paid' && c.status !== 'paid') return false;
    
    if (activeSection === 'Sec A' && c.section !== 'A') return false;
    if (activeSection === 'Sec B' && c.section !== 'B') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.name?.toLowerCase().includes(q) || c.rollNumber?.toLowerCase().includes(q));
    }
    return true;
  });

  const handleActionClick = (student: any, method: 'online' | 'cash') => {
    setSelectedStudent(student);
    setPaymentMethod(method);
    setAmountInput('');
    setShowPopup(true);
  };

  const handlePredefinedAmount = (amt: number) => {
    setAmountInput(amt);
  };

  const handleSubmitPayment = async () => {
    if (!selectedStudent || !paymentMethod || !amountInput) return;
    
    const amt = Number(amountInput);
    if (isNaN(amt) || amt <= 0) return;

    try {
      const currentUser = auth?.currentUser;
      const recipientName = currentUser?.displayName || currentUser?.email || 'Admin';

      // Update contributor
      const docRef = doc(db, 'contributors', selectedStudent.id);
      await updateDoc(docRef, {
        status: 'paid',
        amount: amt,
        paymentMethod,
        recipient: recipientName,
        collected: false,
        timestamp: new Date().toISOString()
      });

      // Update Treasury if Cash
      if (paymentMethod === 'cash') {
        const treasuryRef = doc(db, 'treasury', 'master_ledger');
        const tSnap = await getDoc(treasuryRef);
        if (tSnap.exists()) {
          const tData = tSnap.data();
          await updateDoc(treasuryRef, {
            cash_collected: (tData.cash_collected || 0) + amt
          });
        } else {
          await setDoc(treasuryRef, {
            online_collected: 0,
            cash_collected: amt
          });
        }
      }

      setShowPopup(false);
      setSelectedStudent(null);
      setPaymentMethod(null);
      setAmountInput('');
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Contributors - ${activeTab} - ${activeSection}`, 14, 15);
    
    const tableColumn = activeTab === 'Unpaid' 
      ? ["Roll No.", "Name", "Subsection"]
      : ["Roll No.", "Name", "Subsection", "Amount", "Method", "Recipient"];
      
    const tableRows = filteredData.map(student => {
      if (activeTab === 'Unpaid') {
        return [student.rollNumber, student.name, student.subSection?.toUpperCase()];
      } else {
        return [
          student.rollNumber,
          student.name,
          student.subSection?.toUpperCase(),
          `Rs. ${student.amount}`,
          student.paymentMethod,
          student.recipient
        ];
      }
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Contributors_${activeTab}_${activeSection}.pdf`);
  };

  return (
    <div className="bg-[#111111] p-6 rounded-xl border border-white/10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          CONTRIBUTORS
        </h2>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search by name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#d4ff00] transition-colors"
            />
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
        {['Unpaid', 'Paid'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#d4ff00] text-black'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-6">
        {['Sec A', 'Sec B'].map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === sec
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="text-xs uppercase bg-white/5 text-white/60">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Roll No.</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Subsection</th>
              {activeTab === 'Unpaid' ? (
                <th className="px-6 py-4 rounded-tr-lg">Action</th>
              ) : (
                <>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 rounded-tr-lg">Recipient</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((student) => (
              <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono">{student.rollNumber}</td>
                <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                <td className="px-6 py-4 uppercase">{student.subSection}</td>
                {activeTab === 'Unpaid' ? (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleActionClick(student, 'online')}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/30 transition-colors text-xs"
                      >
                        Paid Online
                      </button>
                      <button
                        onClick={() => handleActionClick(student, 'cash')}
                        className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded border border-green-500/30 transition-colors text-xs"
                      >
                        Paid Cash
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4 text-[#d4ff00] font-bold">₹{student.amount}</td>
                    <td className="px-6 py-4 capitalize">{student.paymentMethod}</td>
                    <td className="px-6 py-4">{student.recipient}</td>
                  </>
                )}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={activeTab === 'Unpaid' ? 4 : 6} className="px-6 py-8 text-center text-white/50">
                  No records found for {activeTab} in {activeSection}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Record Payment</h3>
            <p className="text-white/70 text-sm mb-6">
              {selectedStudent?.name} ({selectedStudent?.rollNumber})<br/>
              Method: <span className="capitalize font-bold text-[#d4ff00]">{paymentMethod}</span>
            </p>

            <div className="flex justify-between gap-2 mb-4">
              {[501, 1001, 1501].map(amt => (
                <button
                  key={amt}
                  onClick={() => handlePredefinedAmount(amt)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Other amounts..."
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00] transition-colors mb-6"
            />

            <button
              onClick={handleSubmitPayment}
              disabled={!amountInput || Number(amountInput) <= 0}
              className="w-full py-3 bg-[#d4ff00] text-black font-bold rounded-lg hover:bg-[#b5d900] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
