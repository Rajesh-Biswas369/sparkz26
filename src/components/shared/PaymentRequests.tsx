"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IndianRupee } from 'lucide-react';

interface PaymentRequestsProps {
  userData: any;
}

export default function PaymentRequests({ userData }: PaymentRequestsProps) {
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [billUrl, setBillUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvance, setIsAdvance] = useState(false);
  const [hasPastRequests, setHasPastRequests] = useState(false);

  useEffect(() => {
    if (!userData?.email) return;
    const q = query(
      collection(db, "payment_requests"),
      where("requestedEmail", "==", userData.email)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setHasPastRequests(!snapshot.empty);
      if (!snapshot.empty) {
        setIsAdvance(false);
      }
    });
    return () => unsub();
  }, [userData?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose || !amount || !upiId || !phone) {
      alert("Please fill in all basic fields before submitting.");
      return;
    }
    if (!isAdvance && !billUrl) {
      alert("Please provide the bill proof link or select advance payment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        purpose,
        amount: Number(amount),
        upiId,
        phone,
        billProofUrl: isAdvance ? 'ADVANCE PAYMENT' : billUrl,
        isAdvancePayment: isAdvance,
        requestedBy: userData?.name || 'Admin',
        requestedEmail: userData?.email || '',
        status: 'PENDING_MASTER',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "payment_requests"), payload);
      
      setPurpose('');
      setAmount('');
      setUpiId('');
      setPhone('');
      setBillUrl('');
      setIsAdvance(false);
      
      alert("Payment Request Submitted Successfully!");
    } catch (error) {
      console.error("Error submitting payment request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] tracking-widest uppercase mb-6 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
        <IndianRupee className="text-[#00E5FF]" />
        PAYMENT REQUEST
      </h2>

      <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="md:col-span-2">
            <label className="block text-[#00E5FF] text-xs font-['Orbitron',sans-serif] mb-2 uppercase tracking-wider">Purpose of Payment <sup className="text-red-500">*</sup></label>
            <input 
              type="text" 
              className="w-full bg-black/50 border border-white/10 focus:border-[#00E5FF] rounded-lg px-4 py-3 text-white outline-none font-['Inter',sans-serif] transition-colors"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[#00E5FF] text-xs font-['Orbitron',sans-serif] mb-2 uppercase tracking-wider">Amount <sup className="text-red-500">*</sup></label>
            <input 
              type="number" 
              className="w-full bg-black/50 border border-white/10 focus:border-[#00E5FF] rounded-lg px-4 py-3 text-white outline-none font-['Inter',sans-serif] transition-colors"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[#00E5FF] text-xs font-['Orbitron',sans-serif] mb-2 uppercase tracking-wider">UPI ID <sup className="text-red-500">*</sup></label>
            <input 
              type="text" 
              className="w-full bg-black/50 border border-white/10 focus:border-[#00E5FF] rounded-lg px-4 py-3 text-white outline-none font-['Inter',sans-serif] transition-colors"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[#00E5FF] text-xs font-['Orbitron',sans-serif] mb-2 uppercase tracking-wider">Phone Number <sup className="text-red-500">*</sup> (Linked to UPI)</label>
            <input 
              type="tel" 
              className="w-full bg-black/50 border border-white/10 focus:border-[#00E5FF] rounded-lg px-4 py-3 text-white outline-none font-['Inter',sans-serif] transition-colors"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-start gap-3 cursor-pointer group mb-4">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                checked={isAdvance}
                onChange={(e) => setIsAdvance(e.target.checked)}
                disabled={hasPastRequests}
              />
              <span className={`text-xs font-['Inter',sans-serif] ${hasPastRequests ? 'text-gray-600' : 'text-red-500 group-hover:text-red-400'} transition-colors`}>
                I will surely upload the bill proof and paste the bill link here in my next payment request and this is an advance payment.
              </span>
            </label>

            <label className={`block text-[#00E5FF] text-xs font-['Orbitron',sans-serif] mb-2 uppercase tracking-wider ${isAdvance ? 'opacity-50' : ''}`}>Bill Proof {!isAdvance && <sup className="text-red-500">*</sup>}</label>
            <div className={`flex flex-col sm:flex-row gap-3 ${isAdvance ? 'opacity-50 pointer-events-none' : ''}`}>
              <a 
                href="https://drive.google.com/drive/folders/1t8ZXixzFFFWsZ1Jd9wH_h88A5rW6NSjZ" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="shrink-0 bg-white/5 border border-white/20 hover:border-[#00E5FF] hover:text-[#00E5FF] px-4 py-3 sm:py-2 rounded-lg text-xs font-['Orbitron',sans-serif] flex items-center justify-center gap-2 transition-all text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              >
                📁 UPLOAD BILL TO DRIVE
              </a>
              <input 
                type="url" 
                placeholder="Paste the Drive link of the uploaded bill here..." 
                className="flex-1 bg-black/50 border border-white/10 focus:border-[#00E5FF] rounded-lg px-4 py-3 sm:py-2 text-white outline-none font-['Inter',sans-serif] transition-colors" 
                value={billUrl} 
                onChange={(e) => setBillUrl(e.target.value)} 
                required={!isAdvance} 
              />
            </div>
            <p className={`text-gray-500 text-xs mt-2 font-['Inter',sans-serif] ${isAdvance ? 'opacity-50' : ''}`}>Please upload your bill to the drive folder and paste the viewable link here.</p>
          </div>

          <div className="md:col-span-2 mt-4 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`bg-transparent border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black transition-all px-8 py-3 rounded-lg font-['Orbitron',sans-serif] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'SUBMITTING...' : '[ SUBMIT REQUEST ]'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
