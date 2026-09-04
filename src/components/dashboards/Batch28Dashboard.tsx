import React from 'react';

export default function Batch28Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md border border-green-500/50 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.2)]">
      <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-bold text-green-400 tracking-widest uppercase mb-4 text-center">
        Batch '28 (Senior)
      </h1>
      <p className="font-['Inter',sans-serif] text-slate-400 text-center">
        Payment confirmed badge active. No QR required.
      </p>
    </div>
  );
}
