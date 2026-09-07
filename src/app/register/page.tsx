"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700"] });

export default function RegisterPage() {
  const router = useRouter();

  // Form State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [gender, setGender] = useState("");
  const [foodPreference, setFoodPreference] = useState("");
  const [tshirtSize, setTshirtSize] = useState("");

  const [section, setSection] = useState("");
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email) setEmail(user.email);
        if (user.displayName) setName(user.displayName);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const isValidRollNumber = (roll: string): boolean => {
    if (roll === "002310801119" || roll === "002310801120") return true;
    
    const currentYear = new Date().getFullYear();
    const offset = currentYear - 2026;
    
    const p1 = `002${5 + offset}`;
    const p2 = `102${4 + offset}`;
    const p3 = `302${6 + offset}`;
    
    const prefix = roll.substring(0, 4);
    return prefix === p1 || prefix === p2 || prefix === p3;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !section || !name || !email || !contactNumber || !gender || !foodPreference || !tshirtSize) {
      setError("Please fill out all required fields.");
      return;
    }

    if (!isValidRollNumber(rollNumber)) {
      setError("Error: Invalid Roll Number format. You are not authorized for this batch.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (db) {
        const usersRef = collection(db, "users");

        // 1. Check Roll Number Uniqueness
        const rollQuery = query(usersRef, where("roll_number", "==", rollNumber));
        const rollSnapshot = await getDocs(rollQuery);
        if (!rollSnapshot.empty) {
          const isConflict = rollSnapshot.docs.some(d => d.id !== email);
          if (isConflict) {
            setError("This Roll Number is already registered.");
            setLoading(false);
            return;
          }
        }

        // 2. Check Contact Number Uniqueness
        const contactQuery = query(usersRef, where("contact_number", "==", contactNumber));
        const contactSnapshot = await getDocs(contactQuery);
        if (!contactSnapshot.empty) {
          const isConflict = contactSnapshot.docs.some(d => d.id !== email);
          if (isConflict) {
            setError("This Phone Number is already in use.");
            setLoading(false);
            return;
          }
        }

        await setDoc(
          doc(db, "users", email),
          {
            name,
            email,
            roll_number: rollNumber,
            section,
            contact_number: contactNumber,
            gender,
            food_preference: foodPreference,
            tshirt_size: tshirtSize,
            batch: "29",
            entry_scanned: false,
            breakfast_scanned: false,
            lunch_scanned: false,
            tshirt_scanned: false,
            absence_status: 'none',
            absence_reason: '',
            absence_proof_url: '',
            registration_complete: true,
          },
          { merge: true }
        );
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: "spring", bounce: 0.4 } },
  };

  // Close dropdown when clicking outside (simple implementation: close on any click inside the container not caught by the button)
  return (
    <div 
      className="min-h-screen bg-transparent text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-[#00E5FF] selection:text-black relative overflow-hidden pt-20"
      onClick={() => isSectionOpen && setIsSectionOpen(false)}
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15),transparent_60%)] rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg pb-12 mt-8">
        {/* Glassmorphism Container */}
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative">
          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            <div className="text-center mb-8">
              <h1 className={`${orbitron.className} text-3xl md:text-4xl font-bold text-center mb-2 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.8)] uppercase`}>
                COMPLETE REGISTRATION
              </h1>
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 py-2 rounded">{error}</p>}

            <div className="space-y-4 font-['Inter',sans-serif]">
              {/* Name */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  readOnly
                  className="w-full bg-black/20 border border-white/10 rounded-full px-6 py-3 text-gray-400 placeholder-gray-500 cursor-not-allowed"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Roll Number */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Full Roll Number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Section Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSectionOpen(!isSectionOpen);
                  }}
                  className={`w-full bg-transparent border ${isSectionOpen ? 'border-[#00E5FF] ring-1 ring-[#00E5FF]' : 'border-white/20'} rounded-full px-6 py-3 text-left transition-all ${section ? 'text-white' : 'text-gray-400'} focus:outline-none`}
                >
                  {section || "Select Section"}
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
                    ▼
                  </span>
                </button>
                {isSectionOpen && (
                  <div 
                    className="absolute z-20 w-full mt-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-flow-col grid-rows-3 gap-3 text-center">
                      {["A1", "A2", "A3", "B1", "B2", "B3"].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setSection(sec);
                            setIsSectionOpen(false);
                          }}
                          className={`py-2 rounded-xl border transition-all ${section === sec ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'}`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Number */}
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 xxxxxxxxxx"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Gender */}
              <div className="relative px-2">
                <label className="block text-sm text-gray-400 mb-2 pl-4">Gender</label>
                <div className="flex flex-wrap gap-4 pl-4">
                  {["Male", "Female", "Prefer not to mention"].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="gender" value={g} checked={gender === g} onChange={(e) => setGender(e.target.value)} className="accent-[#00E5FF] w-4 h-4" required />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Food Preference */}
              <div className="relative px-2">
                <label className="block text-sm text-gray-400 mb-2 pl-4">Food Preference</label>
                <div className="flex gap-6 pl-4">
                  {["Veg", "Non-Veg"].map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="food" value={f} checked={foodPreference === f} onChange={(e) => setFoodPreference(e.target.value)} className="accent-[#00E5FF] w-4 h-4" required />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* T-Shirt Size */}
              <div className="relative px-2">
                <label className="block text-sm text-gray-400 mb-2 pl-4">T-Shirt Size</label>
                <div className="flex flex-wrap gap-4 pl-4">
                  {[
                    { value: "XS", label: "XS (30\")" },
                    { value: "S", label: "S (32\")" },
                    { value: "M", label: "M (36\")" },
                    { value: "L", label: "L (40\")" },
                    { value: "XL", label: "XL (44\")" },
                    { value: "XXL", label: "XXL (48\")" }
                  ].map((s) => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="tshirt" value={s.value} checked={tshirtSize === s.value} onChange={(e) => setTshirtSize(e.target.value)} className="accent-[#00E5FF] w-4 h-4" required />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{s.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-6 mb-2 pl-4 pr-4">
                  <img 
                    src="/T-shirt-size.jpg" 
                    alt="T-Shirt Size Chart" 
                    className="w-full max-w-md rounded-lg border border-white/10 shadow-lg object-contain"
                  />
                </div>

                <p className="text-sm text-[#E07020] mt-4 pl-4">
                  Disclaimer: T-Shirts will not be provided to those who won't be attending the freshers without any genuine reasons.
                </p>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00E5FF] text-black font-bold text-lg py-4 mt-6 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              style={{ clipPath: "polygon(5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%, 0% 50%)" }}
            >
              {loading ? "SAVING..." : "SUBMIT"}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
