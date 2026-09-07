"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Footer from '@/components/Footer';
import UserParticipationModal from '@/components/events/UserParticipationModal';
import { Sparkles, Music, Mic, Drama, BookOpen, Guitar, CheckCircle2 } from 'lucide-react';

const EVENTS = [
  {
    id: 'dance',
    title: 'Dance',
    types: 'Solo / Duet / Group / Fusion',
    icon: <Sparkles className="w-8 h-8 text-[#00E5FF]" />,
    color: 'from-[#00E5FF]/20 to-[#00E5FF]/5',
    borderColor: 'border-[#00E5FF]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]'
  },
  {
    id: 'singing',
    title: 'Singing',
    types: 'Vocal – Solo / Duet / Group',
    icon: <Mic className="w-8 h-8 text-[#00E5FF]" />,
    color: 'from-[#00E5FF]/20 to-[#00E5FF]/5',
    borderColor: 'border-[#00E5FF]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]'
  },
  {
    id: 'instrumental',
    title: 'Instrumental',
    types: 'Solo / Group',
    icon: <Guitar className="w-8 h-8 text-[#00E5FF]" />,
    color: 'from-[#00E5FF]/20 to-[#00E5FF]/5',
    borderColor: 'border-[#00E5FF]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]'
  },
  {
    id: 'drama',
    title: 'Drama / Theatre / Skit',
    types: 'Group',
    icon: <Drama className="w-8 h-8 text-[#00E5FF]" />,
    color: 'from-[#00E5FF]/20 to-[#00E5FF]/5',
    borderColor: 'border-[#00E5FF]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]'
  },
  {
    id: 'recitation',
    title: 'POETRY/MUSICAL RECITATION',
    types: 'Solo / Group',
    icon: <BookOpen className="w-8 h-8 text-[#00E5FF]" />,
    color: 'from-[#00E5FF]/20 to-[#00E5FF]/5',
    borderColor: 'border-[#00E5FF]',
    glow: 'group-hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]'
  }
];

export default function EventsPage() {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userParticipations, setUserParticipations] = useState<any[]>([]);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        const q = query(
          collection(db, 'participations'),
          where('participantIds', 'array-contains', user.email)
        );
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const participations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUserParticipations(participations);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUserParticipations([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleRegisterClick = (eventTitle: string) => {
    if (!auth?.currentUser) {
      alert("You must be logged in to register for an event. Please log in first.");
      router.push('/login');
      return;
    }
    
    setSelectedEvent(eventTitle);
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (eventTitle: string, existingData: any) => {
    setSelectedEvent(eventTitle);
    setEditData(existingData);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden w-full">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#E07020]/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-start p-8 relative z-10 w-full pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-['Orbitron',sans-serif] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00E5FF] to-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] mb-4">
            Cultural Events
          </h1>
          <p className="text-gray-400 font-['Inter',sans-serif] text-lg max-w-2xl mx-auto">
            Showcase your talent on the biggest stage. Register yourself or your team for the cultural performances at SPARKZ'26.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
          {EVENTS.map((event, index) => {
            const registeredEntry = userParticipations.find(p => p.eventCategory === event.title);
            
            return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative bg-black/40 backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between h-full transition-all duration-500 ${event.glow}`}
              style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${event.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500">
                  {event.icon}
                </div>
                
                <h2 className="text-2xl font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wider">
                  {event.title}
                </h2>
                
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded text-[#00E5FF] font-['Inter',sans-serif] text-xs font-semibold tracking-wider self-start">
                  {event.types}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                {registeredEntry ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-white/5 border border-green-500/50 text-green-400 py-3 text-center font-['Orbitron',sans-serif] font-bold rounded flex items-center justify-center gap-2 uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                      REGISTERED <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <button 
                      onClick={() => handleEditClick(event.title, registeredEntry)} 
                      className="text-xs text-[#00E5FF] hover:text-white underline w-full text-center transition-colors font-['Inter',sans-serif]"
                    >
                      Edit Registration
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegisterClick(event.title)}
                    className="w-full bg-[#00E5FF]/10 border border-[#00E5FF]/50 text-[#00E5FF] font-['Orbitron',sans-serif] font-bold py-3 uppercase tracking-widest transition-all duration-300 hover:bg-[#00E5FF] hover:text-black hover:shadow-[0_0_20px_rgba(0,229,255,0.6)]"
                    style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
                  >
                    Register Now
                  </button>
                )}
              </div>
            </motion.div>
          )})}
        </div>
      </div>

      <Footer />

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
