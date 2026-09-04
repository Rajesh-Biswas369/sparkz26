"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { User, LogOut, CheckCircle2, XCircle, UploadCloud, Download, Calendar, MapPin, Clock, Edit2 } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import UserParticipationModal from '@/components/events/UserParticipationModal';

const StatusBadge = ({ label, status, timestamp }: { label: string, status: boolean | undefined, timestamp?: string }) => (
  <div className={`flex flex-col p-3 rounded-lg border ${status ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
    <div className="flex items-center justify-between w-full">
      <span className="text-white/80 text-sm font-['Inter',sans-serif]">{label}</span>
      {status ? (
        <CheckCircle2 size={18} className="text-green-400" />
      ) : (
        <XCircle size={18} className="text-red-400" />
      )}
    </div>
    {status && timestamp && (
      <span className="text-xs text-gray-400 italic mt-1">{timestamp}</span>
    )}
  </div>
);

export default function Batch29Dashboard({ userData }: { userData: any }) {
  const router = useRouter();
  const [absenceReason, setAbsenceReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const qrRef = React.useRef<HTMLDivElement>(null);
  const ticketRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [userParticipations, setUserParticipations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  React.useEffect(() => {
    if (!userData?.email) return;

    const q = query(
      collection(db, 'participations'),
      where('participantIds', 'array-contains', userData.email)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserParticipations(participations);
    });

    return () => unsubscribe();
  }, [userData?.email]);

  const downloadTicket = async () => {
    if (ticketRef.current) {
      setIsDownloading(true);
      try {
        const width = ticketRef.current.offsetWidth;
        const height = ticketRef.current.offsetHeight;

        // Run twice to ensure full rendering (workaround for html-to-image blank captures)
        await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
        const dataUrl = await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [width, height]
        });
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`SPARKZ26_Pass_${userData.roll_number || 'Pass'}.pdf`);
      } catch (err) {
        console.error('Failed to download ticket', err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("admin_role");
      // Use window.location.href for a full reload to clear all states reliably
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceReason.trim() || !userData?.email) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const q = query(collection(db, "users"), where("email", "==", userData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          absence_reason: absenceReason,
          absence_status: 'pending'
        });
        setSubmitMessage('Your absence request has been successfully submitted.');
        setAbsenceReason('');
      } else {
        setSubmitMessage('Error: User document not found.');
      }
    } catch (err) {
      console.error("Error submitting absence request:", err);
      setSubmitMessage('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="w-full min-h-screen flex flex-col relative z-10 pt-24 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      
      <div className="fixed top-0 left-0 w-0 h-0 overflow-hidden z-[-50] pointer-events-none opacity-0">
        <div 
          ref={ticketRef}
          className="relative w-[450px] bg-[#090909] p-8 flex flex-col items-center text-white font-['Inter',sans-serif]"
        >
          {/* Sci-Fi HUD Corner Brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00E5FF]"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00E5FF]"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00E5FF]"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00E5FF]"></div>

          <div className="mt-4 flex flex-col items-center">
            <h1 className="font-['Orbitron',sans-serif] text-4xl font-bold uppercase tracking-widest text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
              SPARKZ '26
            </h1>
            <h2 className="font-['Orbitron',sans-serif] text-lg font-bold uppercase tracking-widest text-[#00E5FF] mt-1 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
              OFFICIAL EVENT TOKEN
            </h2>
          </div>
          
          <div className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 mt-8 mb-8">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">NAME</span>
                <span className="font-bold text-white text-base">{userData.name || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">ROLL NO</span>
                <span className="font-bold text-[#00E5FF] text-base">{userData.roll_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">FOOD</span>
                <span className="font-bold text-white text-base">{userData.food_preference || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">T-SHIRT</span>
                <span className="font-bold text-white text-base uppercase">{userData.tshirt_size || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl mb-8 shadow-[0_0_40px_rgba(0,229,255,0.4)]">
            <QRCodeSVG 
              value={JSON.stringify({ roll_number: userData.roll_number })} 
              size={180}
              level="Q"
              includeMargin={false}
            />
          </div>

          <div className="w-full flex flex-col items-center border-t border-[#00E5FF]/30 pt-6 px-4">
            <div className="flex flex-row items-center justify-center gap-2 w-full text-[#00E5FF]">
              <Calendar size={18} />
              <span className="whitespace-nowrap text-sm font-bold tracking-wide">
                OFFICIAL START | September 26, 2026 at 10:00 AM
              </span>
              <Clock size={18} />
            </div>
            
            <div className="flex flex-row items-center justify-center gap-2 w-full mt-3 text-gray-300">
              <img src="/julogo.png" alt="JU Logo" width={20} height={20} className="opacity-90" />
              <span className="whitespace-nowrap text-sm">
                Electrical Engineering Dept, Jadavpur University
              </span>
              <MapPin size={18} className="text-gray-400" />
            </div>

            <span className="text-center text-xs text-gray-400 italic mt-5">Please present this QR code at the registration desk.</span>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full flex flex-col items-center">
        {/* Top Profile Header */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between bg-black/60 backdrop-blur-md border border-[#00E5FF]/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full border-2 border-[#00E5FF] overflow-hidden flex items-center justify-center bg-black">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-[#00E5FF]" />
              )}
            </div>
            <div>
              <h1 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold text-white uppercase tracking-wider drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                {userData.name || "Student"}
              </h1>
              <p className="font-['Inter',sans-serif] text-[#00E5FF]/80 text-sm md:text-base">
                {userData.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 md:mt-0 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-['Orbitron',sans-serif] tracking-widest text-sm uppercase transition-all flex items-center space-x-2 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
            style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-8">
          
          {/* Left Column (REGISTRATION DETAILS) */}
          <div className="bg-black/60 backdrop-blur-md border border-[#00E5FF]/20 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,229,255,0.1)] flex flex-col">
            <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] uppercase tracking-widest mb-6 flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] rotate-45"></div>
              <span>Registration Details</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Inter',sans-serif] bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="flex flex-col space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Roll Number</span>
                <span className="text-white text-lg font-medium tracking-wide">{userData.roll_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Section</span>
                <span className="text-[#00E5FF] text-lg font-bold tracking-wide">{userData.section || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Contact Number</span>
                <span className="text-white text-lg font-medium tracking-wide">{userData.contact_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Gender</span>
                <span className="text-white text-lg font-medium tracking-wide capitalize">{userData.gender || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Food Preference</span>
                <span className="text-white text-lg font-medium tracking-wide capitalize">{userData.food_preference || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">T-Shirt Size</span>
                <span className="text-white text-lg font-medium tracking-wide uppercase">{userData.tshirt_size || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Right Column (DIGITAL ENTRY PASS) */}
          <div className="bg-black/60 backdrop-blur-md border border-[#00E5FF]/20 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,229,255,0.1)] flex flex-col items-center">
            <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] uppercase tracking-widest mb-6 w-full text-left flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] rotate-45"></div>
              <span>Digital Entry Pass</span>
            </h2>
            
            <div className="flex flex-col items-center">
              <div 
                ref={qrRef}
                className="bg-white p-4 rounded-xl mb-4 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <QRCodeSVG 
                  value={JSON.stringify({ roll_number: userData.roll_number })} 
                  size={200}
                  level="Q"
                  includeMargin={false}
                />
              </div>
              
              <button 
                onClick={downloadTicket}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-2 bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black rounded-full font-['Orbitron',sans-serif] text-sm uppercase tracking-wider transition-colors mb-8 shadow-[0_0_15px_rgba(0,229,255,0.2)] disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isDownloading ? "Generating..." : "Download Ticket"}</span>
              </button>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <StatusBadge label="Entry" status={userData.entry_scanned} timestamp={userData.entry_scanned_time} />
              <StatusBadge label="T-Shirt" status={userData.tshirt_scanned} timestamp={userData.tshirt_scanned_time} />
              <StatusBadge label="Breakfast" status={userData.breakfast_scanned} timestamp={userData.breakfast_scanned_time} />
              <StatusBadge label="Lunch" status={userData.lunch_scanned} timestamp={userData.lunch_scanned_time} />
            </div>
          </div>
        </div>

        {/* YOUR ACTIVITIES / MY TEAMS Section */}
        {userParticipations.length > 0 && (
          <div className="w-full mt-8 bg-black/60 backdrop-blur-md border border-[#00E5FF]/20 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,229,255,0.1)] relative overflow-hidden">
            <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] uppercase tracking-widest mb-6 flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] rotate-45"></div>
              <span>Your Activities / My Teams</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userParticipations.map((part) => (
                <div key={part.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-[#00E5FF]/50 transition-colors group">
                  <div className="flex flex-col gap-2 mb-4">
                    <span className="text-[#00E5FF] font-['Orbitron',sans-serif] font-bold text-lg uppercase tracking-wider">{part.eventCategory}</span>
                    <span className="text-white/60 text-xs uppercase tracking-widest font-semibold bg-white/5 px-2 py-1 rounded self-start">{part.performanceType}</span>
                    {part.songName && (
                      <span className="text-white text-sm font-['Inter',sans-serif] mt-2">
                        <span className="text-white/40 text-xs">Song:</span> {part.songName} ({part.durationFormatted})
                      </span>
                    )}
                    <span className="text-white text-sm font-['Inter',sans-serif] mt-2 break-words">
                      <span className="text-white/40 text-xs">Team:</span> {part.participantNames ? part.participantNames.join(', ') : part.participantName || part.rollNumber}
                    </span>
                  </div>
                  {part.submittedBy === userData.email && (
                    <button
                      onClick={() => {
                        setSelectedEvent(part.eventCategory);
                        setEditData(part);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 w-full mt-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 py-2 rounded uppercase text-xs font-['Orbitron',sans-serif] font-bold tracking-widest hover:bg-[#00E5FF] hover:text-black transition-colors"
                    >
                      <Edit2 size={14} /> Edit Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Section (ABSENCE REQUEST) */}
        <div className="w-full mt-8 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-lg mb-16 relative overflow-hidden">
          {/* Decorative faint grid in background of this box */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10">
            <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white uppercase tracking-widest mb-2">
              Absence Request <span className="text-white/50 text-sm">(Couldn't attend?)</span>
            </h2>
            <p className="text-slate-400 text-sm mb-6 font-['Inter',sans-serif]">
              Comment your reason and attach proof. This will be sent to the Master Admins.
            </p>
            
            <form onSubmit={handleAbsenceSubmit} className="flex flex-col space-y-4">
              <textarea
                className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/50 transition-all resize-none min-h-[120px] font-['Inter',sans-serif]"
                placeholder="Enter your reason for absence..."
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                required
              />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="relative">
                  <input 
                    type="file" 
                    id="proof-upload"
                    className="hidden"
                  />
                  <label 
                    htmlFor="proof-upload"
                    className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full text-white cursor-pointer transition-all font-['Inter',sans-serif] text-sm"
                  >
                    <UploadCloud size={18} />
                    <span>Attach Proof Document</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-['Orbitron',sans-serif] tracking-widest text-sm uppercase transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
              
              {submitMessage && (
                <p className={`text-sm mt-2 font-['Inter',sans-serif] ${submitMessage.includes('Error') ? 'text-red-400' : 'text-[#00E5FF]'}`}>
                  {submitMessage}
                </p>
              )}
            </form>
          </div>
        </div>

      </div>

      {selectedEvent && (
        <UserParticipationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventCategory={selectedEvent}
          editData={editData}
        />
      )}
    </div>
  );
}
