"use client";

import React from 'react';
import { UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';

interface AdminGodRegistrationPermitProps {
  allowRegistration: boolean;
  onToggle: () => void;
}

export default function AdminGodRegistrationPermit({ allowRegistration, onToggle }: AdminGodRegistrationPermitProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white tracking-widest uppercase mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <UserPlus className="text-green-500" />
        Registration Permit
      </h2>

      {/* Toggle Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div>
          <h3 className="text-lg font-bold font-['Orbitron',sans-serif] text-white tracking-wider mb-2">
            Student Registration Permit
          </h3>
          <p className="text-gray-400 text-sm font-['Inter',sans-serif]">
            Turn this on to allow new students to register. If turned off, the registration page will be closed.
          </p>
        </div>
        
        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 ${
            allowRegistration 
              ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
              : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
          }`}
        >
          {allowRegistration ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          <span className="font-['Orbitron',sans-serif] font-bold tracking-widest uppercase text-sm">
            {allowRegistration ? 'REGISTRATION ON' : 'REGISTRATION OFF'}
          </span>
        </button>
      </div>
    </div>
  );
}
