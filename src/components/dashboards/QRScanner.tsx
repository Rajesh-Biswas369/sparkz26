"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function QRScanner() {
  const [scannedStudent, setScannedStudent] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [masterControls, setMasterControls] = useState({
    allow_entry: false,
    allow_tshirt: false,
    allow_breakfast: false,
    allow_lunch: false
  });
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "scanner_controls"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterControls({
          allow_entry: !!data.allow_entry,
          allow_tshirt: !!data.allow_tshirt,
          allow_breakfast: !!data.allow_breakfast,
          allow_lunch: !!data.allow_lunch
        });
      } else {
        setMasterControls({ allow_entry: false, allow_tshirt: false, allow_breakfast: false, allow_lunch: false });
      }
    }, (error) => {
      console.error("Failed to fetch scanner controls: ", error);
      setMasterControls({ allow_entry: false, allow_tshirt: false, allow_breakfast: false, allow_lunch: false });
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
    }

    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(console.error);
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, []);

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(console.error);
    }
  };

  const startScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          stopScanner(); // Automatically stop on successful read
          
          try {
            const parsedData = JSON.parse(decodedText);
            if (!parsedData.email) {
              // Ensure we at least have email for backward compatibility with old formats
              setError("Invalid QR Format");
              return;
            }

            const usersRef = collection(db, "users");
            // Only query by email so that if a student edits their roll_number, their old QR code still works
            const q = query(usersRef, where("email", "==", parsedData.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              setError("Data Not Found !");
            } else {
              const userDoc = querySnapshot.docs[0];
              setScannedStudent({ id: userDoc.id, ...userDoc.data() });
              setError(null);
              
              try {
                const audio = new Audio('/success-beep.mp3');
                audio.play().catch(() => {});
              } catch (e) {}
            }
          } catch (err) {
            console.error("Parse or fetch error", err);
            setError("Data Not Found !");
          }
        },
        (errorMessage) => {
          // ignore scan errors during camera feed
        }
      ).then(() => {
        setIsScanning(true);
      }).catch(console.error);
    }
  };

  const handleAction = async (fieldBase: string) => {
    if (!scannedStudent) return;
    
    setUpdating(fieldBase);
    try {
      const fieldStatus = `${fieldBase}_scanned`;
      const fieldTime = `${fieldBase}_scanned_time`;
      
      const userRef = doc(db, "users", scannedStudent.id);
      
      const updateData: any = {
        [fieldStatus]: true,
        [fieldTime]: new Date().toLocaleString()
      };
      
      await updateDoc(userRef, updateData);
      
      // Update local state
      setScannedStudent({
        ...scannedStudent,
        ...updateData
      });
    } catch (err) {
      console.error(`Error updating ${fieldBase}`, err);
      alert(`Error updating ${fieldBase}. Try again.`);
    } finally {
      setUpdating(null);
    }
  };

  const resetScanner = () => {
    setScannedStudent(null);
    setError(null);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {!scannedStudent && (
        <div className="w-full flex flex-col items-center">
          <h2 className="font-['Orbitron',sans-serif] text-xl text-[#00E5FF] mb-4 uppercase tracking-widest text-center">
            Scan Event Token
          </h2>
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-lg border border-red-500/50">
              <XCircle size={20} className="text-red-500 font-bold" />
              <span className="font-['Inter',sans-serif] text-lg font-bold">{error}</span>
            </div>
          )}
          
          <div className="w-full max-w-md mx-auto p-1 bg-black/40 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-[#00E5FF] bg-black aspect-square"></div>
            <button 
              onClick={isScanning ? stopScanner : startScanner}
              className={`mt-4 mx-auto block px-6 py-2 rounded-full text-sm font-bold font-['Orbitron',sans-serif] transition-all ${isScanning ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-[#00E5FF] hover:bg-white text-black'}`}
            >
              {isScanning ? "STOP SCANNING" : "START SCANNING"}
            </button>
          </div>
          
          {error && (
            <button
              onClick={resetScanner}
              className="mt-6 px-6 py-2 bg-white/10 text-white font-['Orbitron',sans-serif] text-sm uppercase tracking-wider hover:bg-white/20 transition-colors duration-300"
              style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {scannedStudent && (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          <div className="w-full bg-black/60 backdrop-blur-md border border-[#00E5FF]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col relative overflow-hidden">
            
            {/* Background decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/10 rounded-full blur-[50px]"></div>

            <div className="flex flex-col items-center mb-8 border-b border-white/10 pb-6 text-center z-10">
              <h3 className="font-['Orbitron',sans-serif] text-2xl font-bold text-white uppercase tracking-widest mb-2">
                {scannedStudent.name || "Unknown Name"}
              </h3>
              <p className="font-['Orbitron',sans-serif] text-[#00E5FF] text-lg tracking-widest bg-[#00E5FF]/10 px-3 py-1 rounded border border-[#00E5FF]/30">
                {scannedStudent.roll_number}
              </p>
              
              <div className="mt-6">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-['Inter',sans-serif]">Food Preference</span>
                <p className={`font-['Orbitron',sans-serif] text-xl font-bold uppercase mt-1 ${scannedStudent.food_preference?.toLowerCase() === 'non-veg' || scannedStudent.food_preference?.toLowerCase() === 'nonveg' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]'}`}>
                  {scannedStudent.food_preference || "Not Specified"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
              
              <ActionButton 
                label="Entry"
                fieldBase="entry"
                scannedStudent={scannedStudent}
                updating={updating}
                onAction={handleAction}
                isAllowed={masterControls.allow_entry}
              />
              
              <ActionButton 
                label="T-Shirt"
                fieldBase="tshirt"
                scannedStudent={scannedStudent}
                updating={updating}
                onAction={handleAction}
                isAllowed={masterControls.allow_tshirt}
              />
              
              <ActionButton 
                label="Breakfast"
                fieldBase="breakfast"
                scannedStudent={scannedStudent}
                updating={updating}
                onAction={handleAction}
                isAllowed={masterControls.allow_breakfast}
              />
              
              <ActionButton 
                label="Lunch"
                fieldBase="lunch"
                scannedStudent={scannedStudent}
                updating={updating}
                onAction={handleAction}
                isAllowed={masterControls.allow_lunch}
              />
              
            </div>
          </div>

          <button
            onClick={resetScanner}
            className="mt-8 flex items-center space-x-2 px-8 py-3 bg-[#00E5FF] text-black font-['Orbitron',sans-serif] font-bold text-sm uppercase tracking-widest hover:bg-[#00E5FF]/80 transition-colors duration-300 shadow-[0_0_20px_rgba(0,229,255,0.4)] relative z-10"
            style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0% 100%)" }}
          >
            <RefreshCw size={18} />
            <span>Scan Next Ticket</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, fieldBase, scannedStudent, updating, onAction, isAllowed }: any) {
  const isDone = scannedStudent[`${fieldBase}_scanned`];
  const isUpdating = updating === fieldBase;
  const timeStr = scannedStudent[`${fieldBase}_scanned_time`];
  const isAbsent = scannedStudent.is_absent === true;

  if (isAbsent && fieldBase !== 'tshirt') {
    return (
      <button 
        disabled
        className="flex flex-col items-center justify-center py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-['Orbitron',sans-serif] uppercase tracking-wider opacity-70 cursor-not-allowed"
      >
        <div className="flex items-center space-x-2">
          <XCircle size={16} />
          <span>{label} Cancelled</span>
        </div>
      </button>
    );
  }

  if (isDone) {
    return (
      <button 
        disabled
        className="flex flex-col items-center justify-center py-3 px-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-['Orbitron',sans-serif] uppercase tracking-wider shadow-[0_0_15px_rgba(74,222,128,0.2)] opacity-80 cursor-not-allowed"
      >
        <div className="flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{label} Done</span>
        </div>
        {timeStr && <span className="text-[10px] text-green-500/70 mt-1 lowercase font-['Inter',sans-serif] tracking-normal truncate w-full text-center">{timeStr}</span>}
      </button>
    );
  }

  if (!isAllowed) {
    return (
      <button 
        disabled
        className="flex items-center justify-center space-x-2 py-4 px-4 border border-white/10 bg-white/5 rounded-lg font-['Orbitron',sans-serif] uppercase tracking-wider text-gray-500 opacity-30 cursor-not-allowed pointer-events-none"
      >
        <span>{label} Locked</span>
      </button>
    );
  }

  return (
    <button 
      onClick={() => onAction(fieldBase)}
      disabled={isUpdating}
      className={`flex items-center justify-center space-x-2 py-4 px-4 border border-white/20 rounded-lg font-['Orbitron',sans-serif] uppercase tracking-wider transition-all duration-300 ${isUpdating ? 'bg-white/10 text-gray-400' : 'bg-[#00E5FF]/10 text-white hover:bg-[#00E5FF]/20 hover:border-[#00E5FF]/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]'}`}
    >
      {isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
      <span>Mark {label}</span>
    </button>
  );
}
