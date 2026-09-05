"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Download, Search, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentRecords() {
  const [students, setStudents] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState<'Registered' | 'Appeared'>('Registered');
  const [activeSection, setActiveSection] = useState<'Sec A' | 'Sec B'>('Sec A');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, "users"), where("batch", "==", "29"));
    const unsubStudents = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        section: doc.data().section || '',
        entry_scanned: doc.data().entry_scanned || false
      }));
      setStudents(studentData);
    });

    return () => {
      unsubStudents();
    };
  }, []);

  // Filter logic
  let filteredStudents = students;

  // 1. Filter by Status
  if (activeStatus === 'Appeared') {
    filteredStudents = filteredStudents.filter(s => s.entry_scanned === true);
  }

  // 2. Filter by Section
  if (activeSection === 'Sec A') {
    filteredStudents = filteredStudents.filter(s => s.section?.toUpperCase().startsWith('A'));
  } else if (activeSection === 'Sec B') {
    filteredStudents = filteredStudents.filter(s => s.section?.toUpperCase().startsWith('B'));
  }

  // 3. Filter by Search Query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredStudents = filteredStudents.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.contact_number || '').toLowerCase().includes(q)
    );
  }

  // Sort logic
  filteredStudents.sort((a, b) => {
    const secCompare = (a.section || '').localeCompare(b.section || '');
    if (secCompare !== 0) return secCompare;
    return (a.roll_number || '').localeCompare(b.roll_number || '');
  });

  // Calculate live stats
  const totalRegistered = students.length;
  const secAReg = students.filter(s => s.section?.toUpperCase().startsWith('A')).length;
  const secBReg = students.filter(s => s.section?.toUpperCase().startsWith('B')).length;
  const appearedLive = students.filter(s => s.entry_scanned === true).length;
  
  const breakfastGiven = students.filter(s => s.breakfast_scanned === true).length;
  const lunchGiven = students.filter(s => s.lunch_scanned === true).length;
  const tshirtGiven = students.filter(s => s.tshirt_scanned === true).length;

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("SPARKZ 2K26 - Student Records", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Status: ${activeStatus} | Section: ${activeSection}`, 14, 22);
    doc.text(`Total Headcount: ${filteredStudents.length}`, 14, 27);
    
    const columns = ['Sl No.', 'Name', 'Roll Number', 'Section', 'Contact', 'Email', 'T-Shirt Size'];
    const rows = filteredStudents.map((s, index) => [
      index + 1,
      s.name || 'N/A',
      s.roll_number || 'N/A',
      s.section || 'N/A',
      s.contact_number || 'N/A',
      s.email || 'N/A',
      s.tshirt_size || 'N/A'
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`SPARKZ26_${activeStatus}_${activeSection}.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-['Orbitron',sans-serif] text-xl font-bold text-white tracking-widest uppercase mb-4 flex items-center gap-3">
        <Users className="text-[#00E5FF]" />
        Student Records
      </h2>

      {/* Live Stats Header (Primary Filter - Status & Info) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div 
          onClick={() => setActiveStatus('Registered')}
          className={`cursor-pointer transition-all bg-black/30 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center ${
            activeStatus === 'Registered' 
            ? 'border-2 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.4)]' 
            : 'border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)] opacity-70 hover:opacity-100'
          }`}
        >
          <span className="text-gray-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1 text-center">Total Registered</span>
          <span className={`font-['Orbitron',sans-serif] text-3xl font-bold ${activeStatus === 'Registered' ? 'text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'text-white'}`}>
            {totalRegistered}
          </span>
        </div>
        
        <div 
          onClick={() => setActiveStatus('Appeared')}
          className={`cursor-pointer transition-all bg-[#00E5FF]/10 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden ${
            activeStatus === 'Appeared'
            ? 'border-2 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]'
            : 'border border-[#00E5FF]/50 shadow-[0_0_20px_rgba(0,229,255,0.3)] opacity-70 hover:opacity-100'
          }`}
        >
          {activeStatus === 'Appeared' && <div className="absolute top-0 right-0 w-12 h-12 bg-green-400/20 rounded-full blur-[20px]"></div>}
          <span className={`${activeStatus === 'Appeared' ? 'text-green-400' : 'text-[#00E5FF]'} text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1 font-bold text-center`}>
            Appeared (Live)
          </span>
          <span className={`font-['Orbitron',sans-serif] text-3xl font-bold ${activeStatus === 'Appeared' ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]' : 'text-white'}`}>
            {appearedLive}
          </span>
        </div>

        {/* Informational Status Boxes */}
        <div className="bg-[#E07020]/10 border border-[#E07020]/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-[#E07020] text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1 text-center font-bold">Breakfast</span>
          <span className="font-['Orbitron',sans-serif] text-3xl font-bold text-[#E07020] drop-shadow-[0_0_8px_rgba(224,112,32,0.5)]">{breakfastGiven}</span>
        </div>
        <div className="bg-[#E07020]/10 border border-[#E07020]/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-[#E07020] text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1 text-center font-bold">Lunch</span>
          <span className="font-['Orbitron',sans-serif] text-3xl font-bold text-[#E07020] drop-shadow-[0_0_8px_rgba(224,112,32,0.5)]">{lunchGiven}</span>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-purple-400 text-[10px] font-['Inter',sans-serif] uppercase tracking-widest mb-1 text-center font-bold">T-Shirt</span>
          <span className="font-['Orbitron',sans-serif] text-3xl font-bold text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">{tshirtGiven}</span>
        </div>
      </div>
      
      {/* Secondary Filters (Section) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {['Sec A', 'Sec B'].map(sec => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec as 'Sec A' | 'Sec B')}
              className={`px-4 py-2 rounded-lg font-['Orbitron',sans-serif] text-sm uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                activeSection === sec 
                ? 'bg-[#00E5FF] text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.5)]' 
                : 'bg-transparent border border-[#00E5FF]/40 text-white hover:border-[#00E5FF]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 ml-0 md:ml-4 mt-4 sm:mt-0 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111]/50 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none w-full md:w-64 transition-all font-['Inter',sans-serif] text-sm"
            />
          </div>
          <button
            onClick={exportToPDF}
            className="shrink-0 bg-transparent border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all px-4 py-2 rounded-lg font-['Orbitron',sans-serif] text-sm flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <Download size={16} />
            <span className="inline">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto overflow-x-auto backdrop-blur-md bg-white/5 border border-white/10 rounded-xl mt-6 flex-grow min-h-[60vh]">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
            <p className="text-gray-400 font-['Inter',sans-serif]">No students found for this section.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap text-white">
            <thead>
              <tr>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Sl No.</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Name & Roll</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Section</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Contact</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Email</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">T-Shirt</th>
                <th className="p-4 font-['Orbitron',sans-serif] text-[#00E5FF] border-b border-white/10">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-['Orbitron',sans-serif] font-bold text-white uppercase tracking-wide truncate max-w-[200px]">{student.name}</span>
                      <span className="font-['Inter',sans-serif] text-xs text-[#00E5FF]">{student.roll_number}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {student.section && (
                      <span className="bg-white/10 border border-white/20 text-white text-[10px] px-2 py-1 rounded font-['Orbitron',sans-serif]">
                        {student.section}
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{student.contact_number || 'N/A'}</td>
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300 max-w-[200px] truncate" title={student.email}>{student.email || 'N/A'}</td>
                  <td className="p-4 font-['Inter',sans-serif] text-gray-300">{student.tshirt_size || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {student.is_absent ? (
                        <>
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider border border-red-500/30 text-red-400 bg-red-500/10">
                            ENTRY <X size={10} className="text-red-400" />
                          </span>
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider border border-red-500/30 text-red-400 bg-red-500/10">
                            B-FAST <X size={10} className="text-red-400" />
                          </span>
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider border border-red-500/30 text-red-400 bg-red-500/10">
                            LUNCH <X size={10} className="text-red-400" />
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${student.entry_scanned === true ? 'border border-green-500 text-green-400 bg-green-500/10' : 'border border-white/20 text-gray-500 bg-white/5'}`}>
                            ENTRY
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${student.breakfast_scanned === true ? 'border border-green-500 text-green-400 bg-green-500/10' : 'border border-white/20 text-gray-500 bg-white/5'}`}>
                            B-FAST
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${student.lunch_scanned === true ? 'border border-green-500 text-green-400 bg-green-500/10' : 'border border-white/20 text-gray-500 bg-white/5'}`}>
                            LUNCH
                          </span>
                        </>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${student.tshirt_scanned === true ? 'border border-green-500 text-green-400 bg-green-500/10' : 'border border-white/20 text-gray-500 bg-white/5'}`}>
                        TSHIRT
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
