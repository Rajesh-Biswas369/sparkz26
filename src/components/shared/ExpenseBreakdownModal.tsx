"use client";

import React from 'react';
import { X } from 'lucide-react';

interface Expense {
  id?: string;
  amount?: number;
  purpose?: string;
  upiId?: string;
  utrNumber?: string;
  paidAt?: string | { toDate: () => Date };
  [key: string]: any;
}

interface ExpenseBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

export default function ExpenseBreakdownModal({ isOpen, onClose, expenses }: ExpenseBreakdownModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Unknown Date';
    if (typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleString();
    }
    return new Date(dateValue).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-red-500/50 rounded-xl w-full max-w-md shadow-[0_0_30px_rgba(239,68,68,0.2)] flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] tracking-widest uppercase">
            Expense Breakdown
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-grow">
          {expenses.length === 0 ? (
            <div className="text-center text-gray-500 py-10 font-['Inter',sans-serif]">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {expenses.map((req, idx) => (
                <div key={req.id || idx} className="bg-white/5 border-l-2 border-red-500 p-4 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-['Orbitron',sans-serif] text-sm uppercase max-w-[70%] break-words">
                      {req.purpose || 'Unknown Purpose'}
                    </span>
                    <span className="text-red-500 font-['Orbitron',sans-serif] font-bold">
                      -₹{req.amount || 0}
                    </span>
                  </div>
                  
                  <div className="text-gray-400 font-['Inter',sans-serif] text-xs mb-3">
                    Paid To: <span className="text-white">{req.upiId || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-['Inter',sans-serif]">
                    <span className="text-[#00E5FF]/70">UTR: {req.utrNumber || 'N/A'}</span>
                    <span className="text-gray-500">{formatDate(req.paidAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
