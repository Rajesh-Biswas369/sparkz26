"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Download, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MasterPaymentRequests() {
  const [paymentView, setPaymentView] = useState<'pending' | 'history'>('pending');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any[]>([]);

  useEffect(() => {
    // Fetch pending requests (PENDING_MASTER or PENDING_GOD)
    const qPending = query(
      collection(db, "payment_requests"),
      where("status", "in", ["PENDING_MASTER", "PENDING_GOD"])
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation time manually if needed, or rely on firebase order
      setPendingRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    // Fetch history (COMPLETED)
    const qHistory = query(
      collection(db, "payment_requests"),
      where("status", "==", "COMPLETED")
    );
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedRequests(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => {
      unsubPending();
      unsubHistory();
    };
  }, []);

  const handlePassPayment = async (id: string) => {
    try {
      const requestRef = doc(db, "payment_requests", id);
      await updateDoc(requestRef, {
        status: 'PENDING_GOD',
        passedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error passing payment:", error);
      alert("Failed to pass payment request.");
    }
  };

  const exportToPDF = () => {
    const docPdf = new jsPDF('landscape');
    
    docPdf.setFontSize(16);
    docPdf.text("SPARKZ 2K26 - Payment History Ledger", 14, 15);
    
    docPdf.setFontSize(10);
    const totalAmount = completedRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    docPdf.text(`Total Completed Transactions: ${completedRequests.length} | Total Volume: Rs. ${totalAmount}`, 14, 22);
    
    const columns = ['Sl No.', 'Requested By', 'Email', 'Phone', 'Purpose', 'Amount (Rs)', 'UPI ID', 'UTR Number', 'Status'];
    const rows = completedRequests.map((r, index) => [
      index + 1,
      r.requestedBy || 'N/A',
      r.requestedEmail || 'N/A',
      r.phone || 'N/A',
      r.purpose || 'N/A',
      r.amount || '0',
      r.upiId || 'N/A',
      r.utrNumber || 'N/A',
      'SUCCESS'
    ]);

    autoTable(docPdf, {
      head: [columns],
      body: rows,
      startY: 27,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    docPdf.save(`SPARKZ26_Payment_History.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* Dual Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-black/40 border border-[#00E5FF]/20 rounded-lg p-1 backdrop-blur-md">
          <button
            onClick={() => setPaymentView('pending')}
            className={`px-6 py-2 rounded-md font-['Orbitron',sans-serif] text-xs uppercase tracking-widest transition-all duration-300 ${
              paymentView === 'pending'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)] border border-[#00E5FF]'
                : 'text-gray-400 hover:text-[#00E5FF] border border-transparent'
            }`}
          >
            PENDING PAYMENTS
          </button>
          <button
            onClick={() => setPaymentView('history')}
            className={`px-6 py-2 rounded-md font-['Orbitron',sans-serif] text-xs uppercase tracking-widest transition-all duration-300 ${
              paymentView === 'history'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)] border border-[#00E5FF]'
                : 'text-gray-400 hover:text-[#00E5FF] border border-transparent'
            }`}
          >
            PAYMENT HISTORY
          </button>
        </div>

        {paymentView === 'history' && (
          <button
            onClick={exportToPDF}
            className="shrink-0 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all px-4 py-2 rounded-lg font-['Orbitron',sans-serif] text-sm flex items-center gap-2 whitespace-nowrap shadow-[0_0_10px_rgba(74,222,128,0.2)] hover:shadow-[0_0_20px_rgba(74,222,128,0.6)]"
          >
            <Download size={16} />
            <span className="hidden md:inline">Download PDF</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="overflow-x-auto backdrop-blur-md bg-white/5 border border-white/10 rounded-xl flex-grow">
        
        {paymentView === 'pending' ? (
          pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <p className="text-gray-400 font-['Inter',sans-serif]">No pending payment requests right now.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap text-white">
              <thead>
                <tr>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Sl No.</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Requested By</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Purpose</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Amount</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">UPI & Phone</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-center">Bill Link</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-right">Action/Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r, index) => (
                  <tr key={r.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wide">{r.requestedBy}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-gray-400">{r.requestedEmail}</span>
                      </div>
                    </td>
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300 max-w-[200px] truncate" title={r.purpose}>{r.purpose}</td>
                    <td className="p-4 font-['Orbitron',sans-serif] text-lg font-bold text-[#E07020]">₹{r.amount}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Inter',sans-serif] text-[#00E5FF]">{r.upiId}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-gray-400">{r.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {r.billProofUrl ? (
                        <a href={r.billProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-colors border border-blue-500/50">
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'PENDING_MASTER' ? (
                        <button 
                          onClick={() => handlePassPayment(r.id)}
                          className="bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black transition-all px-3 py-1.5 rounded font-['Orbitron',sans-serif] text-xs tracking-wider shadow-[0_0_10px_rgba(0,229,255,0.2)] hover:shadow-[0_0_15px_rgba(0,229,255,0.6)]"
                        >
                          PASS PAYMENT
                        </button>
                      ) : (
                        <span className="border border-yellow-500 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded text-xs font-bold tracking-widest font-['Orbitron',sans-serif]">
                          PASSED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          completedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <p className="text-gray-400 font-['Inter',sans-serif]">No completed payment requests found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap text-white">
              <thead>
                <tr>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Sl No.</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Requested By</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Purpose</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Amount</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">UPI Details</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">UTR Number</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedRequests.map((r, index) => (
                  <tr key={r.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wide">{r.requestedBy}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-gray-400">{r.requestedEmail} | {r.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300 max-w-[200px] truncate" title={r.purpose}>{r.purpose}</td>
                    <td className="p-4 font-['Orbitron',sans-serif] text-lg font-bold text-green-400">₹{r.amount}</td>
                    <td className="p-4 font-['Inter',sans-serif] text-[#00E5FF]">{r.upiId}</td>
                    <td className="p-4 font-['Orbitron',sans-serif] text-gray-300 tracking-widest">{r.utrNumber || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <span className="border border-green-500 text-green-400 bg-green-500/10 px-3 py-1.5 rounded text-xs font-bold tracking-widest font-['Orbitron',sans-serif]">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

    </div>
  );
}
