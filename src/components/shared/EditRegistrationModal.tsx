"use client";

import React, { useState } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Save } from 'lucide-react';

interface EditRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

export default function EditRegistrationModal({ isOpen, onClose, userData }: EditRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    roll_number: userData?.roll_number || '',
    section: userData?.section || '',
    contact_number: userData?.contact_number || '',
    gender: userData?.gender || '',
    food_preference: userData?.food_preference || '',
    tshirt_size: userData?.tshirt_size || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Find the differences
      const newData = { ...formData };
      
      // Update the user document
      // We assume userData.id or userData.email is available to query
      // If we don't have the doc id, we can update it in the parent or find the doc
      // Since page.tsx passes userData, we might not have doc ID if it just passes data
      // Let's find the doc by email
      
      import('firebase/firestore').then(async ({ query, where, getDocs, collection }) => {
        const q = query(collection(db, "users"), where("email", "==", userData.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          
          await updateDoc(userDoc.ref, newData);
          
          // Log the edit history
          await addDoc(collection(db, "registration_edits"), {
            userId: userDoc.id,
            email: userData.email,
            name: userData.name,
            timestamp: new Date().toISOString(),
            previousData: {
              name: userData.name,
              roll_number: userData.roll_number,
              section: userData.section,
              contact_number: userData.contact_number,
              gender: userData.gender,
              food_preference: userData.food_preference,
              tshirt_size: userData.tshirt_size
            },
            newData: newData
          });
          
          // Force reload to reflect new data (since parent page.tsx does a one-time fetch)
          window.location.reload();
        } else {
          setError("User document not found.");
          setIsSubmitting(false);
        }
      });
      
    } catch (err) {
      console.error("Error updating details:", err);
      setError("Failed to update details. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white uppercase tracking-widest">
            Edit Details
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          <form id="editForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex flex-col space-y-1">
              <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">Roll Number</label>
                <input
                  type="text"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
                  required
                  className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">Contact Number</label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                required
                className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">Food Preference</label>
                <select
                  name="food_preference"
                  value={formData.food_preference}
                  onChange={handleChange}
                  className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-white/60 text-[10px] uppercase tracking-widest font-bold font-['Inter',sans-serif]">T-Shirt Size</label>
              <select
                name="tshirt_size"
                value={formData.tshirt_size}
                onChange={handleChange}
                className="bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#00E5FF]/50 transition-colors uppercase"
              >
                <option value="s">S (36)</option>
                <option value="m">M (38)</option>
                <option value="l">L (40)</option>
                <option value="xl">XL (42)</option>
                <option value="xxl">XXL (44)</option>
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-['Inter',sans-serif] bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-transparent text-white border border-white/20 hover:bg-white/10 font-['Orbitron',sans-serif] text-sm uppercase tracking-widest transition-colors rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="editForm"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80 font-['Orbitron',sans-serif] font-bold text-sm uppercase tracking-widest transition-colors rounded shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <Save size={16} /> Save
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
