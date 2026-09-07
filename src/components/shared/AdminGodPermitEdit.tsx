"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Edit2, ToggleLeft, ToggleRight, History } from 'lucide-react';

interface AdminGodPermitEditProps {
  allowEdit: boolean;
  onToggle: () => void;
}

export default function AdminGodPermitEdit({ allowEdit, onToggle }: AdminGodPermitEditProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, "registration_edits"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <Edit2 className="text-blue-500" />
        Permit Edit & History
      </h2>

      {/* Toggle Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div>
          <h3 className="text-lg font-bold font-['Orbitron',sans-serif] text-white tracking-wider mb-2">
            Student Registration Editing
          </h3>
          <p className="text-gray-400 text-sm font-['Inter',sans-serif]">
            Turn this on to allow students to edit their registration details (Name, Roll, Section, etc.) from their dashboard.
          </p>
        </div>
        
        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 ${
            allowEdit 
              ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
              : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
          }`}
        >
          {allowEdit ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          <span className="font-['Orbitron',sans-serif] font-bold tracking-widest uppercase text-sm">
            {allowEdit ? 'EDITING ON' : 'EDITING OFF'}
          </span>
        </button>
      </div>

      {/* History Table */}
      <div className="flex flex-col flex-grow bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-white/10 bg-black/40 flex items-center gap-2">
          <History className="text-blue-500" size={18} />
          <h3 className="font-['Orbitron',sans-serif] text-sm text-white tracking-widest uppercase">
            Edit History Log
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-['Orbitron',sans-serif]">
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Previous Details</th>
                <th className="p-4 font-medium">New Details</th>
              </tr>
            </thead>
            <tbody className="text-sm font-['Inter',sans-serif]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No edit history found.</td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-300 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{log.name}</span>
                        <span className="text-gray-400 text-xs">{log.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {Object.entries(log.previousData || {}).map(([key, value]) => (
                          <li key={key}><span className="capitalize text-white/50">{key.replace('_', ' ')}:</span> {String(value)}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4 text-blue-400">
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {Object.entries(log.newData || {}).map(([key, value]) => (
                          <li key={key}><span className="capitalize text-white/50">{key.replace('_', ' ')}:</span> {String(value)}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
