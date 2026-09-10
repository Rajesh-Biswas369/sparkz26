"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ContributionAnalysis() {
  const [contributors, setContributors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Received' | 'Collection'>('Received');

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

  const totalContributors = contributors.length;
  const paidContributorsCount = contributors.filter(c => c.status === 'paid').length;
  
  // Calculate cash pending collection per Master Admin
  const uncollectedCash = contributors.filter(c => c.status === 'paid' && c.paymentMethod === 'cash' && !c.collected);
  const adminCashMap = uncollectedCash.reduce((acc, curr) => {
    const admin = curr.recipient || 'Unknown Admin';
    if (!acc[admin]) acc[admin] = 0;
    acc[admin] += (curr.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const receivedData = Object.entries(adminCashMap).map(([name, amt]) => ({ name, amt }));

  // Collection Data (already collected)
  const collectedCash = contributors.filter(c => c.status === 'paid' && c.paymentMethod === 'cash' && c.collected);
  // Group collections for display, but here we can just show individual collections or grouped by timestamp.
  // The prompt says: date and time vs master admin name vs amt vs status (recieved)
  // Since multiple rows might be collected at once, let's group them by recipient and timestamp if possible,
  // or just show each contributor's collected amount.
  // Actually, better to just map each collected contributor or group by admin + timestamp.
  // We'll show individual transactions that are collected for simplicity and accuracy.
  const collectionData = collectedCash.map(c => ({
    date: c.collectedTimestamp ? new Date(c.collectedTimestamp).toLocaleString() : 'N/A',
    name: c.recipient,
    amt: c.amount,
    status: 'Received'
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCollect = async (adminName: string) => {
    try {
      const batch = writeBatch(db);
      const toCollect = uncollectedCash.filter(c => (c.recipient || 'Unknown Admin') === adminName);
      
      const now = new Date().toISOString();
      toCollect.forEach(c => {
        const docRef = doc(db, 'contributors', c.id);
        batch.update(docRef, {
          collected: true,
          collectedTimestamp: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error collecting cash:", error);
    }
  };

  const downloadCollectionPDF = () => {
    const doc = new jsPDF();
    doc.text(`Contribution Analysis - Collection`, 14, 15);
    
    const tableColumn = ["Date & Time", "Master Admin Name", "Amount", "Status"];
    const tableRows = collectionData.map(item => [
      item.date,
      item.name,
      `Rs. ${item.amt}`,
      item.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Contribution_Collection.pdf`);
  };

  return (
    <div className="bg-[#111111] p-6 rounded-xl border border-white/10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          CONTRIBUTION ANALYSIS
        </h2>
        
        <div className="flex gap-6">
          <div className="bg-white/5 px-6 py-3 rounded-lg border border-white/10 text-center">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Participation</p>
            <p className="text-2xl font-bold text-[#d4ff00]">
              {paidContributorsCount} <span className="text-white/50 text-lg">/ {totalContributors}</span>
            </p>
          </div>
          <div className="bg-white/5 px-6 py-3 rounded-lg border border-white/10 text-center">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Net Cash to Collect</p>
            <p className="text-2xl font-bold text-green-400">
              ₹{Object.values(adminCashMap).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          {['Received', 'Collection'].map((tab) => (
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
        
        {activeTab === 'Collection' && (
          <button
            onClick={downloadCollectionPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Collection</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="text-xs uppercase bg-white/5 text-white/60">
            <tr>
              {activeTab === 'Received' ? (
                <>
                  <th className="px-6 py-4 rounded-tl-lg">Master Admin Name</th>
                  <th className="px-6 py-4">Cash Amt</th>
                  <th className="px-6 py-4 rounded-tr-lg">Action</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 rounded-tl-lg">Date & Time</th>
                  <th className="px-6 py-4">Master Admin Name</th>
                  <th className="px-6 py-4">Amt</th>
                  <th className="px-6 py-4 rounded-tr-lg">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {activeTab === 'Received' ? (
              receivedData.length > 0 ? (
                receivedData.map((data, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{data.name}</td>
                    <td className="px-6 py-4 text-[#d4ff00] font-bold">₹{data.amt}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCollect(data.name)}
                        className="px-4 py-1.5 bg-[#d4ff00]/20 text-[#d4ff00] hover:bg-[#d4ff00]/30 rounded border border-[#d4ff00]/30 transition-colors text-xs font-bold"
                      >
                        Collect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-white/50">
                    No pending cash to collect.
                  </td>
                </tr>
              )
            ) : (
              collectionData.length > 0 ? (
                collectionData.map((data, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">{data.date}</td>
                    <td className="px-6 py-4 font-medium text-white">{data.name}</td>
                    <td className="px-6 py-4 text-green-400 font-bold">₹{data.amt}</td>
                    <td className="px-6 py-4 text-white/50 uppercase text-xs tracking-wider">{data.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/50">
                    No collection history.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
