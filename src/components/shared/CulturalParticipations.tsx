"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Star, Pencil, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddParticipantModal from '../dashboards/AddParticipantModal';

export default function CulturalParticipations() {
  const [participations, setParticipations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipation, setEditingParticipation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, "participations"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipations(data);
    });

    return () => unsub();
  }, []);

  const totalDurationSeconds = participations.reduce((sum, p) => sum + (p.durationSeconds || 0), 0);

  const formatTotalTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const sortedParticipations = [...participations].sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));

  let finalParticipations = sortedParticipations;
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    finalParticipations = finalParticipations.filter(p => 
      (p.participantNames ? p.participantNames.join(', ').toLowerCase() : (p.participantName || '').toLowerCase()).includes(q) ||
      (p.participantRolls ? p.participantRolls.join(', ').toLowerCase() : (p.rollNumber || '').toLowerCase()).includes(q) ||
      (p.classAndSection || '').toLowerCase().includes(q)
    );
  }

  const downloadParticipationsPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("SPARKZ 2K26 - Cultural Participations Schedule", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Total Entries: ${participations.length} | Total Estimated Time: ${formatTotalTime(totalDurationSeconds)}`, 14, 22);
    
    const columns = ['Sl No.', 'Participant Name', 'Roll Number', 'Class & Sec', 'Contact', 'Event Details', 'Timing'];
    const rows = sortedParticipations.map((p, index) => [
      index + 1,
      p.participantNames ? p.participantNames.join(', ') : p.participantName || 'N/A',
      p.participantRolls ? p.participantRolls.join(', ') : p.rollNumber || 'N/A',
      p.classAndSection || 'N/A',
      p.contact || 'N/A',
      `${p.eventCategory || 'N/A'} - ${p.performanceType || 'N/A'}\nSong: ${p.songName || 'N/A'}`,
      p.durationFormatted || '00:00'
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 27,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`SPARKZ26_Cultural_Participations.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-[#00E5FF] tracking-widest uppercase flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
            <Star className="text-[#00E5FF]" />
            CULTURAL PARTICIPATIONS
          </h2>
          <p className="font-['Inter',sans-serif] text-sm text-gray-400 mt-1">
            Total Entries: {participations.length} | Total Estimated Time: {formatTotalTime(totalDurationSeconds)}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111]/50 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none w-full md:w-64 transition-all font-['Inter',sans-serif] text-sm"
            />
          </div>

          <button
            onClick={downloadParticipationsPDF}
            className="bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all px-4 py-2 rounded-lg font-['Orbitron',sans-serif] text-sm tracking-wider whitespace-nowrap flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.2)] hover:shadow-[0_0_20px_rgba(74,222,128,0.6)] w-full sm:w-auto justify-center"
          >
            <Download size={16} />
            <span className="inline">Download PDF</span>
          </button>

          <button
            onClick={() => {
              setEditingParticipation(null);
              setIsModalOpen(true);
            }}
            className="bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black transition-all px-4 py-2 rounded-lg font-['Orbitron',sans-serif] text-sm tracking-wider whitespace-nowrap shadow-[0_0_10px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] w-full sm:w-auto"
          >
            + ADD PARTICIPANT
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto overflow-x-auto backdrop-blur-md bg-white/5 border border-white/10 rounded-xl flex-grow min-h-[60vh]">
        {finalParticipations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
            <p className="text-gray-400 font-['Inter',sans-serif]">No cultural participations recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap text-white">
            <thead>
              <tr>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Sl No.</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Participant Name</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Roll Number</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Class & Sec</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Contact</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Event Details</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Timing</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {finalParticipations.map((p, index) => (
                <tr key={p.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{index + 1}</td>
                  <td className="p-4 font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wide max-w-[200px] truncate" title={p.participantNames ? p.participantNames.join(', ') : p.participantName || 'N/A'}>
                    {p.participantNames ? p.participantNames.join(', ') : p.participantName || 'N/A'}
                  </td>
                  <td className="p-4 font-['Inter',sans-serif] text-[#00E5FF]">{p.participantRolls ? p.participantRolls.join(', ') : p.rollNumber || 'N/A'}</td>
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{p.classAndSection || 'N/A'}</td>
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{p.contact || 'N/A'}</td>
                  <td className="p-4 border-b border-white/5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="bg-white/10 border border-white/20 text-white text-[10px] px-2 py-1 rounded font-['Orbitron',sans-serif]">
                        {p.eventCategory || 'N/A'} - {p.performanceType || 'N/A'}
                      </span>
                      <span className="text-[10px] text-[#00E5FF]/70 max-w-[150px] truncate" title={p.songName || 'N/A'}>
                        ♫ {p.songName || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{p.durationFormatted || '00:00'}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setEditingParticipation(p);
                        setIsModalOpen(true);
                      }}
                      className="text-[#00E5FF] hover:text-white bg-[#00E5FF]/10 hover:bg-[#00E5FF]/30 p-2 rounded-lg transition-colors inline-flex items-center gap-2 font-['Orbitron',sans-serif] text-xs uppercase"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddParticipantModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingParticipation(null);
        }}
        editData={editingParticipation}
      />
    </div>
  );
}
