"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Utensils, Shirt } from 'lucide-react';

export default function LogisticsStats() {
  const [stats, setStats] = useState({
    veg: 0,
    nonVeg: 0,
    tshirts: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0
    }
  });

  useEffect(() => {
    const q = query(collection(db, "users"), where("batch", "==", "29"));
    const unsub = onSnapshot(q, (snapshot) => {
      let vegCount = 0;
      let nonVegCount = 0;
      const tshirtCounts = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.is_absent) return;
        
        // Food
        const food = data.food_preference?.toLowerCase();
        if (food === 'veg') vegCount++;
        else if (food === 'non-veg') nonVegCount++;

        // T-Shirt
        const size = data.tshirt_size?.toUpperCase();
        if (size && (tshirtCounts as any)[size] !== undefined) {
          (tshirtCounts as any)[size]++;
        }
      });

      setStats({
        veg: vegCount,
        nonVeg: nonVegCount,
        tshirts: tshirtCounts
      });
    });

    return () => unsub();
  }, []);

  const getTshirtDisplay = (size: string) => {
    const sizes: Record<string, string> = {
      'XS': 'XS (30")',
      'S': 'S (32")',
      'M': 'M (36")',
      'L': 'L (40")',
      'XL': 'XL (44")',
      'XXL': 'XXL (48")'
    };
    return sizes[size] || size;
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] tracking-widest uppercase">
          Logistics Statistics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Food Stats */}
        <div className="bg-black/40 backdrop-blur-md border border-[#E07020]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(224,112,32,0.15)] flex flex-col">
          <h3 className="font-['Orbitron',sans-serif] text-sm text-[#E07020] uppercase tracking-widest mb-6 flex items-center gap-2">
            <Utensils size={18} />
            Food Preferences
          </h3>
          <div className="grid grid-cols-2 gap-4 flex-grow">
            <div className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-4 justify-center items-center">
              <span className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest mb-2">Veg</span>
              <span className="font-['Orbitron',sans-serif] text-3xl font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                {stats.veg}
              </span>
            </div>
            <div className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-4 justify-center items-center">
              <span className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest mb-2">Non-Veg</span>
              <span className="font-['Orbitron',sans-serif] text-3xl font-bold text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">
                {stats.nonVeg}
              </span>
            </div>
          </div>
        </div>

        {/* T-Shirt Stats */}
        <div className="bg-black/40 backdrop-blur-md border border-[#00E5FF]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(0,229,255,0.15)] flex flex-col">
          <h3 className="font-['Orbitron',sans-serif] text-sm text-[#00E5FF] uppercase tracking-widest mb-6 flex items-center gap-2">
            <Shirt size={18} />
            T-Shirt Requirements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(stats.tshirts).map(([size, count]) => (
              <div key={size} className="flex flex-col bg-white/5 border border-white/10 rounded-lg p-3 justify-center items-center">
                <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1">{getTshirtDisplay(size)}</span>
                <span className="font-['Orbitron',sans-serif] text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
