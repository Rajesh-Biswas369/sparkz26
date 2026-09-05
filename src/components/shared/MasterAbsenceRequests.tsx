"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Download, ExternalLink, HelpCircle, Check, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MasterAbsenceRequests() {
  const [view, setView] = useState<'pending' | 'history'>('pending');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [historyRequests, setHistoryRequests] = useState<any[]>([]);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  useEffect(() => {
    // Fetch pending requests
    const qPending = query(
      collection(db, "users"),
      where("absence_status", "==", "pending")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingRequests(data);
    });

    // Fetch history (confirmed or rejected)
    const qHistory = query(
      collection(db, "users"),
      where("absence_status", "in", ["confirmed", "rejected"])
    );
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryRequests(data);
    });

    return () => {
      unsubPending();
      unsubHistory();
    };
  }, []);

  const handleConfirm = async (id: string) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        absence_status: 'confirmed',
        entry_scanned: false,
        breakfast_scanned: false,
        lunch_scanned: false,
        tshirt_scanned: true,
        tshirt_scanned_time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: true }),
        is_absent: true // Flag to show cross mark in StudentRecords
      });
    } catch (error) {
      console.error("Error confirming absence:", error);
      alert("Failed to confirm absence request.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        absence_status: 'rejected'
      });
    } catch (error) {
      console.error("Error rejecting absence:", error);
      alert("Failed to reject absence request.");
    }
  };

  const exportToPDF = () => {
    const docPdf = new jsPDF('landscape');
    
    docPdf.setFontSize(16);
    docPdf.text("SPARKZ 2K26 - Absence Requests History", 14, 15);
    
    docPdf.setFontSize(10);
    docPdf.text(`Total Processed Requests: ${historyRequests.length}`, 14, 22);
    
    const columns = ['Sl No.', 'Name', 'Roll Number', 'Section', 'Phone', 'Email', 'Reason', 'Status'];
    const rows = historyRequests.map((r, index) => [
      index + 1,
      r.name || 'N/A',
      r.roll_number || 'N/A',
      r.section || 'N/A',
      r.contact_number || 'N/A',
      r.email || 'N/A',
      r.absence_reason || 'N/A',
      r.absence_status === 'confirmed' ? 'CONFIRMED' : 'REJECTED'
    ]);

    autoTable(docPdf, {
      head: [columns],
      body: rows,
      startY: 27,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    docPdf.save(`SPARKZ26_Absence_History.pdf`);
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Dual Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-black/40 border border-[#00E5FF]/20 rounded-lg p-1 backdrop-blur-md">
          <button
            onClick={() => setView('pending')}
            className={`px-6 py-2 rounded-md font-['Orbitron',sans-serif] text-xs uppercase tracking-widest transition-all duration-300 ${
              view === 'pending'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)] border border-[#00E5FF]'
                : 'text-gray-400 hover:text-[#00E5FF] border border-transparent'
            }`}
          >
            PENDING REQUESTS
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-6 py-2 rounded-md font-['Orbitron',sans-serif] text-xs uppercase tracking-widest transition-all duration-300 ${
              view === 'history'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)] border border-[#00E5FF]'
                : 'text-gray-400 hover:text-[#00E5FF] border border-transparent'
            }`}
          >
            REQUEST HISTORY
          </button>
        </div>

        {view === 'history' && (
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
        
        {view === 'pending' ? (
          pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <p className="text-gray-400 font-['Inter',sans-serif]">No pending absence requests right now.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap text-white">
              <thead>
                <tr>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Sl No.</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Student</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Roll & Sec</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Contact Info</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-center">Reason & Doc</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r, index) => (
                  <tr key={r.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wide">{r.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Inter',sans-serif] text-white">{r.roll_number}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-[#00E5FF]">{r.section}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Inter',sans-serif] text-gray-300">{r.contact_number}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-gray-400">{r.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center relative">
                      <button 
                        onClick={() => setSelectedReason(selectedReason === r.id ? null : r.id)}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-transparent hover:border-white/20"
                      >
                        <HelpCircle size={20} />
                      </button>
                      
                      {selectedReason === r.id && (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 bg-[#1a1a2e] border border-[#00E5FF]/50 p-4 rounded-xl shadow-2xl w-72 text-left animate-in fade-in zoom-in duration-200">
                          <p className="font-['Inter',sans-serif] text-sm text-gray-200 mb-3 whitespace-pre-wrap">{r.absence_reason}</p>
                          {r.absence_doc_link ? (
                            <a href={r.absence_doc_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-[#00E5FF] hover:text-white transition-colors bg-[#00E5FF]/10 px-3 py-2 rounded-lg border border-[#00E5FF]/30 w-full justify-center">
                              <ExternalLink size={14} /> View Attached Doc
                            </a>
                          ) : (
                            <p className="text-xs text-gray-500 italic">No document link provided.</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleConfirm(r.id)}
                          className="bg-green-500/10 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-all p-2 rounded shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                          title="Confirm Absence"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleReject(r.id)}
                          className="bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all p-2 rounded shadow-[0_0_10px_rgba(248,113,113,0.2)]"
                          title="Reject Absence"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          historyRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <p className="text-gray-400 font-['Inter',sans-serif]">No processed absence requests found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap text-white">
              <thead>
                <tr>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Sl No.</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Student</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Roll & Sec</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Reason</th>
                  <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.map((r, index) => (
                  <tr key={r.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wide">{r.name}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-gray-400">{r.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-['Inter',sans-serif] text-white">{r.roll_number}</span>
                        <span className="font-['Inter',sans-serif] text-xs text-[#00E5FF]">{r.section}</span>
                      </div>
                    </td>
                    <td className="p-4 font-['Inter',sans-serif] text-gray-300 max-w-[250px] truncate" title={r.absence_reason}>
                      {r.absence_reason}
                    </td>
                    <td className="p-4 text-right">
                      {r.absence_status === 'confirmed' ? (
                        <span className="border border-green-500 text-green-400 bg-green-500/10 px-3 py-1.5 rounded text-xs font-bold tracking-widest font-['Orbitron',sans-serif]">
                          CONFIRMED
                        </span>
                      ) : (
                        <span className="border border-red-500 text-red-400 bg-red-500/10 px-3 py-1.5 rounded text-xs font-bold tracking-widest font-['Orbitron',sans-serif]">
                          REJECTED
                        </span>
                      )}
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
