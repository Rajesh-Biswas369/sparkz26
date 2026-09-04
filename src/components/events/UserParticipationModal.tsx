import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { X, Search } from 'lucide-react';

interface UserParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventCategory: string;
  editData?: any;
}

export default function UserParticipationModal({ isOpen, onClose, eventCategory, editData }: UserParticipationModalProps) {
  const [performanceType, setPerformanceType] = useState('Solo');
  const [identifiers, setIdentifiers] = useState('');
  
  // Performance Details
  const [songName, setSongName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  // Fetched data
  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (editData && isOpen) {
      setPerformanceType(editData.performanceType || 'Solo');
      setIdentifiers(editData.participantRolls ? editData.participantRolls.join(', ') : (editData.rollNumber || ''));
      setSongName(editData.songName || '');
      const dur = editData.durationFormatted || '00:00';
      const [m, s] = dur.split(':');
      setMinutes(m || '');
      setSeconds(s || '');
      setFetchedUsers([]);
      setFetchMessage('');
    } else if (!editData && isOpen) {
      // Reset
      setPerformanceType('Solo');
      setIdentifiers('');
      setSongName('');
      setMinutes('');
      setSeconds('');
      setFetchedUsers([]);
      setFetchMessage('');
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!identifiers) return;
    setFetchMessage('Fetching...');
    const ids = identifiers.split(',').map(id => id.trim()).filter(id => id);
    try {
      const users = [];
      for (const id of ids) {
        let q = query(collection(db, "users"), where("roll_number", "==", id));
        let snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          q = query(collection(db, "users"), where("email", "==", id));
          snapshot = await getDocs(q);
        }

        if (!snapshot.empty) {
          users.push(snapshot.docs[0].data());
        }
      }

      if (users.length > 0) {
        setFetchedUsers(users);
        setFetchMessage(`Successfully fetched ${users.length} user(s)!`);
      } else {
        setFetchedUsers([]);
        setFetchMessage('No users found.');
      }
    } catch (error) {
      console.error(error);
      setFetchMessage('Error fetching details.');
    }
    setTimeout(() => setFetchMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const min = parseInt(minutes || '0', 10);
    const sec = parseInt(seconds || '0', 10);
    const totalDurationInSeconds = (min * 60) + sec;
    const formattedDuration = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    const currentUserEmail = auth?.currentUser?.email || 'unknown';
    const currentUserName = auth?.currentUser?.displayName || 'Unknown';

    // Build arrays and remove duplicates
    const pIds = Array.from(new Set([currentUserEmail, ...fetchedUsers.map(u => u.email)].filter(Boolean)));
    const pNames = Array.from(new Set([currentUserName, ...fetchedUsers.map(u => u.name)].filter(Boolean)));
    const pRolls = Array.from(new Set([...fetchedUsers.map(u => u.roll_number)].filter(Boolean)));
    const pContacts = Array.from(new Set([...fetchedUsers.map(u => u.contact_number || u.phone)].filter(Boolean)));
    const pSections = Array.from(new Set([...fetchedUsers.map(u => u.section)].filter(Boolean)));

    const payload = {
      participantIds: pIds,
      participantNames: pNames,
      participantRolls: pRolls,
      
      // Keep legacy fields for backward compatibility or simple views
      participantName: pNames.join(', ') || (editData ? editData.participantName : identifiers),
      rollNumber: pRolls.join(', ') || identifiers,
      contact: pContacts.join(', ') || (editData ? editData.contact : ''),
      classAndSection: pSections.length > 0 ? `B.E. 3rd Yr - ${pSections.join(', ')}` : (editData ? editData.classAndSection : ''),
      
      eventCategory: eventCategory,
      performanceType: performanceType,
      participantType: 'Junior', // assuming all students registering here are juniors (batch 28/29)
      songName,
      durationSeconds: totalDurationInSeconds,
      durationFormatted: formattedDuration,
      updatedAt: new Date().toISOString(),
      submittedBy: currentUserEmail
    };

    try {
      if (editData) {
        await updateDoc(doc(db, 'participations', editData.id), payload);
        alert('Registration updated successfully!');
      } else {
        await addDoc(collection(db, 'participations'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        alert('Registration successful!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving document: ', error);
      alert('Failed to save registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#00E5FF] shadow-[0_0_15px_#00E5FF] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="font-['Orbitron',sans-serif] text-2xl font-bold text-[#00E5FF] tracking-widest uppercase mb-6 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
          Register for {eventCategory}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Performance Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Event Category</label>
              <input 
                type="text" 
                value={eventCategory}
                readOnly
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-['Inter',sans-serif] focus:outline-none cursor-not-allowed"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Performance Type</label>
              <select 
                value={performanceType}
                onChange={(e) => setPerformanceType(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors appearance-none"
              >
                <option value="Solo">Solo</option>
                <option value="Duet">Duet</option>
                <option value="Group">Group</option>
              </select>
            </div>
          </div>

          {/* Participant Details */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-4">
            <h3 className="font-['Orbitron',sans-serif] text-sm text-[#00E5FF] uppercase tracking-wider">Team Details</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Emails or Roll Numbers (Comma separated)</label>
              <div className="relative w-full">
                <input 
                  type="text" 
                  value={identifiers}
                  onChange={(e) => setIdentifiers(e.target.value)}
                  required
                  className="w-full pr-12 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  placeholder="e.g. 21CS01, 21CS02"
                />
                <button 
                  type="button"
                  onClick={handleFetch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00E5FF] p-2 transition-colors flex items-center justify-center"
                >
                  <Search size={18} />
                </button>
              </div>
              {fetchMessage && <p className="text-green-400 text-xs mt-1 font-['Inter',sans-serif]">{fetchMessage}</p>}
            </div>
          </div>

          {/* Performance Details */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-4">
            <h3 className="font-['Orbitron',sans-serif] text-sm text-[#00E5FF] uppercase tracking-wider">Performance Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Song/Track Name</label>
                <input 
                  type="text" 
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  placeholder="Optional"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Duration (MM:SS)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-20 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                    placeholder="MM"
                  />
                  <span className="text-white font-bold">:</span>
                  <input 
                    type="number" 
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    className="w-20 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                    placeholder="SS"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF] hover:text-black font-['Orbitron',sans-serif] font-bold py-4 rounded-xl uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] disabled:opacity-50"
          >
            {loading ? (editData ? 'Updating...' : 'Submitting...') : (editData ? 'Update Entry' : 'Submit Entry')}
          </button>
        </form>
      </div>
    </div>
  );
}
