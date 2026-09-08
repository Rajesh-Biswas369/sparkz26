import React, { useState } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Search } from 'lucide-react';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

export default function AddParticipantModal({ isOpen, onClose, editData }: AddParticipantModalProps) {
  const [participantCategory, setParticipantCategory] = useState<'Junior' | 'Senior'>('Junior');
  const [eventCategory, setEventCategory] = useState('Dance');
  const [performanceType, setPerformanceType] = useState('Solo');
  
  // Junior Fields
  const [identifiers, setIdentifiers] = useState('');
  
  // Senior Fields
  const [manualNames, setManualNames] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualClass, setManualClass] = useState('');
  const [manualSection, setManualSection] = useState('');
  
  // Performance Details
  const [songName, setSongName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  // Fetched data for Junior
  const [fetchedName, setFetchedName] = useState('');
  const [fetchedContact, setFetchedContact] = useState('');
  const [fetchedSection, setFetchedSection] = useState('');

  React.useEffect(() => {
    if (editData) {
      setParticipantCategory(editData.participantType || 'Junior');
      setEventCategory(editData.eventCategory || 'Dance');
      setPerformanceType(editData.performanceType || 'Solo');
      setSongName(editData.songName || '');
      
      const dur = editData.durationFormatted || '00:00';
      const [m, s] = dur.split(':');
      setMinutes(m || '');
      setSeconds(s || '');

      if (editData.participantType === 'Junior') {
        setIdentifiers(editData.rollNumber || '');
        setFetchedName(editData.participantName || '');
        setFetchedContact(editData.contact || '');
        setFetchedSection(editData.classAndSection || '');
      } else {
        setManualNames(editData.participantName || '');
        setManualContact(editData.contact || '');
        // Split classAndSection if possible, else just put it in section
        setManualSection(editData.classAndSection || '');
      }
    } else {
      // Reset
      setParticipantCategory('Junior');
      setEventCategory('Dance');
      setPerformanceType('Solo');
      setIdentifiers('');
      setManualNames('');
      setManualContact('');
      setManualClass('');
      setManualSection('');
      setSongName('');
      setMinutes('');
      setSeconds('');
      setFetchedName('');
      setFetchedContact('');
      setFetchedSection('');
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
        setFetchedName(users.map(u => u.name).join(', '));
        setFetchedContact(users.map(u => u.contact_number || u.phone).join(', '));
        setFetchedSection(users.map(u => u.section).join(', '));
        setFetchMessage(`Successfully fetched ${users.length} user(s)!`);
        // We'll store fetched users in a ref or just rely on state. 
        // Actually, we can just fetch again on submit or parse the joined strings.
        // To keep it simple, we'll parse on submit or store users in a new state.
      } else {
        setFetchedName('');
        setFetchedContact('');
        setFetchedSection('');
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

    let pNames: string[] = [];
    let pRolls: string[] = [];
    let pContacts: string[] = [];
    let pSections: string[] = [];
    let legacyName = '';
    let legacyRoll = '';
    let legacyContact = '';
    let legacyClassAndSec = '';

    if (participantCategory === 'Junior') {
      const ids = identifiers.split(',').map(id => id.trim()).filter(id => id);
      pRolls = ids;
      
      // Try to construct arrays from the fetched comma-separated strings.
      // If fetched strings are available, they will align with ids if fetched properly.
      // A better way is to do a quick fetch here if fetchedName is empty, but assuming they clicked fetch:
      pNames = fetchedName ? fetchedName.split(',').map(s => s.trim()) : ids;
      pContacts = fetchedContact ? fetchedContact.split(',').map(s => s.trim()) : [];
      pSections = fetchedSection ? fetchedSection.split(',').map(s => s.trim()) : [];
      
      legacyName = fetchedName || identifiers;
      legacyRoll = identifiers;
      legacyContact = fetchedContact;
      legacyClassAndSec = fetchedSection ? `B.E. 2nd Yr - ${fetchedSection}` : '';
    } else {
      pNames = manualNames.split(',').map(s => s.trim()).filter(Boolean);
      pContacts = manualContact.split(',').map(s => s.trim()).filter(Boolean);
      pSections = manualSection.split(',').map(s => s.trim()).filter(Boolean);
      
      legacyName = manualNames;
      legacyRoll = '';
      legacyContact = manualContact;
      legacyClassAndSec = manualClass ? `${manualClass} - ${manualSection}` : manualSection;
    }

    const payload = {
      participantNames: pNames,
      participantRolls: pRolls,
      participantContacts: pContacts,
      participantSections: pSections,
      
      participantName: legacyName,
      rollNumber: legacyRoll,
      contact: legacyContact,
      classAndSection: legacyClassAndSec,
      
      eventCategory: eventCategory,
      performanceType: performanceType,
      participantType: participantCategory,
      songName,
      durationSeconds: totalDurationInSeconds,
      durationFormatted: formattedDuration,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editData) {
        await updateDoc(doc(db, 'participations', editData.id), payload);
      } else {
        await addDoc(collection(db, 'participations'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Failed to add participant. Check console.');
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
          {editData ? 'Edit Participant' : 'Add Participant'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Participant Category Toggle */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setParticipantCategory('Junior')}
              className={`flex-1 py-3 rounded-lg font-['Orbitron',sans-serif] text-sm uppercase tracking-wider transition-all duration-300 ${
                participantCategory === 'Junior' 
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.3)]' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              Junior
            </button>
            <button
              type="button"
              onClick={() => setParticipantCategory('Senior')}
              className={`flex-1 py-3 rounded-lg font-['Orbitron',sans-serif] text-sm uppercase tracking-wider transition-all duration-300 ${
                participantCategory === 'Senior' 
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.3)]' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              Senior / Guest
            </button>
          </div>

          {/* Event & Performance Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Event Category *</label>
              <select 
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors appearance-none"
              >
                <option value="Dance">Dance</option>
                <option value="Singing">Singing</option>
                <option value="Instrumental">Instrumental</option>
                <option value="Drama / Theatre / Skit">Drama / Theatre / Skit</option>
                <option value="Poetry & Musical Recitation">Poetry & Musical Recitation</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Performance Type *</label>
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
            <h3 className="font-['Orbitron',sans-serif] text-sm text-[#00E5FF] uppercase tracking-wider">Participant Details</h3>
            
            {participantCategory === 'Junior' ? (
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Emails or Roll Numbers (Comma separated) *</label>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Name(s) *</label>
                  <input 
                    type="text" 
                    value={manualNames}
                    onChange={(e) => setManualNames(e.target.value)}
                    required
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Contact Number *</label>
                  <input 
                    type="text" 
                    value={manualContact}
                    onChange={(e) => setManualContact(e.target.value)}
                    required
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Class *</label>
                  <input 
                    type="text" 
                    value={manualClass}
                    onChange={(e) => setManualClass(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Section *</label>
                  <input 
                    type="text" 
                    value={manualSection}
                    onChange={(e) => setManualSection(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Performance Details */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-4">
            <h3 className="font-['Orbitron',sans-serif] text-sm text-[#00E5FF] uppercase tracking-wider">Performance Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Song/Track Name *</label>
                <input 
                  type="text" 
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  required
                  className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-['Inter',sans-serif] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  placeholder="Enter song/track name"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-['Inter',sans-serif] uppercase tracking-widest">Duration (MM:SS) *</label>
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
            className="w-full mt-4 mb-8 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF] hover:text-black font-['Orbitron',sans-serif] font-bold py-4 rounded-xl uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] disabled:opacity-50"
          >
            {loading ? 'Submitting...' : (editData ? 'Update Entry' : 'Submit Entry')}
          </button>
        </form>
      </div>
    </div>
  );
}
