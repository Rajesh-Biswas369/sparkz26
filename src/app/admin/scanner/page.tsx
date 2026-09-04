"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { ScanLine, CheckCircle, XCircle, RotateCcw, Utensils, Shirt, LogIn } from "lucide-react";

interface ScannedUser {
  name: string;
  roll_number: string;
  batch: string;
  food_preference: string;
  entry_scanned: boolean;
  breakfast_scanned: boolean;
  lunch_scanned: boolean;
  tshirt_scanned: boolean;
}

export default function ScannerPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Authentication Check
  useEffect(() => {
    const adminRole = localStorage.getItem("admin_role");
    if (adminRole !== "master" && adminRole !== "subadmin") {
      router.push("/admin/login");
    } else {
      setRole(adminRole);
    }
  }, [router]);

  // Initialize Scanner
  useEffect(() => {
    if (!role || scannedData) return; // Don't init if not authed or already scanned something

    // Delay init slightly to ensure DOM is ready
    const timer = setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [role, scannedData]);

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanner to prevent multiple scans
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    fetchUserData(decodedText);
  };

  const onScanFailure = (error: any) => {
    // Usually ignoring normal frame errors, but can log if needed
  };

  const fetchUserData = async (rollNumber: string) => {
    setLoading(true);
    setError("");
    try {
      const docRef = doc(db, "users", rollNumber);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as ScannedUser;
        setScannedData(data);
      } else {
        setError(`No registration found for roll: ${rollNumber}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setError("");
    setFlashMessage(null);
  };

  const handleAction = async (field: keyof ScannedUser) => {
    if (!scannedData || !scannedData.roll_number) return;
    
    // Check if already claimed
    if (scannedData[field] === true) {
      showFlash("Already Claimed!", "error");
      return;
    }

    try {
      const docRef = doc(db, "users", scannedData.roll_number);
      await updateDoc(docRef, {
        [field]: true
      });
      
      // Update local state
      setScannedData({ ...scannedData, [field]: true });
      showFlash("Successfully logged!", "success");

    } catch (err: any) {
      showFlash("Database error. Try again.", "error");
    }
  };

  const showFlash = (msg: string, type: "success" | "error") => {
    setFlashMessage({ msg, type });
    setTimeout(() => setFlashMessage(null), 2500);
  };

  if (!role) return null; // Wait for auth check

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col items-center p-4 sm:p-8 font-['Inter',sans-serif]">
      
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] uppercase">
            Scanner Agent
          </h1>
          <p className="text-xs text-slate-400">Clearance Level: {role.toUpperCase()}</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem("admin_role"); router.push("/admin/login"); }}
          className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded border border-red-500/50 hover:bg-red-500 hover:text-black transition-colors uppercase font-['Orbitron',sans-serif]"
        >
          Logout
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* Flash Message Overlay */}
        <AnimatePresence>
          {flashMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full border shadow-2xl font-bold uppercase tracking-wider ${
                flashMessage.type === "success" 
                  ? "bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  : "bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              }`}
            >
              {flashMessage.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {flashMessage.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="w-full h-64 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl mb-6">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-6">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={resetScanner} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded font-['Orbitron',sans-serif] uppercase text-sm border border-white/20">
              Try Again
            </button>
          </div>
        )}

        {/* Scanner UI */}
        {!scannedData && !error && !loading && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-[0_0_40px_rgba(0,229,255,0.1)] mb-6">
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg [&_video]:rounded-lg [&_video]:object-cover" />
            <div className="mt-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <ScanLine className="w-4 h-4 text-[#00E5FF]" />
              Align QR Code within the frame
            </div>
          </div>
        )}

        {/* Scanned Data Action Panel */}
        {scannedData && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/5 border border-[#00E5FF]/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.15)]"
          >
            {/* Identity Card */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-b from-[#00E5FF]/10 to-transparent">
              <h2 className="font-['Orbitron',sans-serif] text-2xl font-bold text-white mb-1">
                {scannedData.name}
              </h2>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[#00E5FF] tracking-wider">{scannedData.roll_number}</span>
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${scannedData.batch === '28' ? 'bg-[#E07020]/20 text-[#E07020] border-[#E07020]/30' : 'bg-white/10 text-white border-white/20'}`}>
                  Batch '{scannedData.batch}
                </span>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="p-6 grid grid-cols-1 gap-4">
              
              <ActionButton 
                icon={<LogIn className="w-5 h-5" />}
                label="Log Entry"
                isClaimed={scannedData.entry_scanned}
                onClick={() => handleAction('entry_scanned')}
              />
              
              <ActionButton 
                icon={<Utensils className="w-5 h-5" />}
                label="Give Breakfast"
                isClaimed={scannedData.breakfast_scanned}
                onClick={() => handleAction('breakfast_scanned')}
              />
              
              <ActionButton 
                icon={<Utensils className="w-5 h-5" />}
                label={`Give Lunch (${scannedData.food_preference})`}
                isClaimed={scannedData.lunch_scanned}
                onClick={() => handleAction('lunch_scanned')}
                highlightColor={scannedData.food_preference === 'Veg' ? 'green' : 'red'}
              />
              
              <ActionButton 
                icon={<Shirt className="w-5 h-5" />}
                label="Give T-Shirt"
                isClaimed={scannedData.tshirt_scanned}
                onClick={() => handleAction('tshirt_scanned')}
              />

            </div>

            <div className="p-4 bg-black/40 text-center">
              <button 
                onClick={resetScanner}
                className="flex items-center justify-center gap-2 w-full py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors font-['Orbitron',sans-serif] uppercase text-sm"
              >
                <RotateCcw className="w-4 h-4" /> Scan Next Target
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// Helper Component for Action Buttons
function ActionButton({ 
  icon, 
  label, 
  isClaimed, 
  onClick,
  highlightColor
}: { 
  icon: React.ReactNode, 
  label: string, 
  isClaimed: boolean, 
  onClick: () => void,
  highlightColor?: 'green' | 'red'
}) {
  
  let baseColor = "border-white/20 hover:bg-white/10 text-white";
  if (highlightColor === 'green') baseColor = "border-green-500/30 bg-green-500/5 hover:bg-green-500/20 text-green-400";
  if (highlightColor === 'red') baseColor = "border-red-500/30 bg-red-500/5 hover:bg-red-500/20 text-red-400";

  if (isClaimed) {
    return (
      <button disabled className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 text-slate-500 opacity-70 cursor-not-allowed">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-['Orbitron',sans-serif] font-bold text-sm tracking-wide">{label}</span>
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-slate-600">Claimed</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all active:scale-95 ${baseColor}`}
    >
      {icon}
      <span className="font-['Orbitron',sans-serif] font-bold tracking-wide uppercase text-sm">{label}</span>
    </button>
  );
}
