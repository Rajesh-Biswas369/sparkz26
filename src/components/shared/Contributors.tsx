"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Download, Search, X, Trash2, UserPlus, Edit2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ContributorsProps {
  isAdminGod?: boolean;
}

export default function Contributors({ isAdminGod = false }: ContributorsProps) {
  const [contributors, setContributors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Unpaid' | 'Paid'>('Unpaid');
  const [activeSection, setActiveSection] = useState<'Sec A' | 'Sec B' | 'Others'>('Sec A');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showPopup, setShowPopup] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | null>(null);
  const [amountInput, setAmountInput] = useState<number | string>('');

  // Add Contributor State
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addTab, setAddTab] = useState<'Batch28' | 'Others'>('Batch28');
  const [addFormData, setAddFormData] = useState({ rollNumber: '', name: '', phone: '', subSection: '', section: 'A' });

  // Edit Contributor State
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    const q = query(collection(db, "contributors"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContributors(data);
    });
    return () => unsub();
  }, []);

  const filteredData = contributors.filter(c => {
    if (activeTab === 'Unpaid' && c.status !== 'unpaid') return false;
    if (activeTab === 'Paid' && c.status !== 'paid') return false;
    
    if (activeSection === 'Sec A' && c.section !== 'A') return false;
    if (activeSection === 'Sec B' && c.section !== 'B') return false;
    if (activeSection === 'Others' && c.section !== 'Others') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.name?.toLowerCase().includes(q) || c.rollNumber?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q));
    }
    return true;
  });

  const handleActionClick = (student: any, method: 'online' | 'cash') => {
    setSelectedStudent(student);
    setPaymentMethod(method);
    setAmountInput('');
    setShowPopup(true);
  };

  const handlePredefinedAmount = (amt: number) => {
    setAmountInput(amt);
  };

  const handleSubmitPayment = async () => {
    if (!selectedStudent || !paymentMethod || !amountInput) return;
    
    const amt = Number(amountInput);
    if (isNaN(amt) || amt <= 0) return;

    try {
      const currentUser = auth?.currentUser;
      const recipientName = currentUser?.displayName || currentUser?.email || 'Admin';

      // Update contributor
      const docRef = doc(db, 'contributors', selectedStudent.id);
      await updateDoc(docRef, {
        status: 'paid',
        amount: amt,
        paymentMethod,
        recipient: recipientName,
        collected: false,
        timestamp: new Date().toISOString()
      });

      // Update Treasury if Cash
      if (paymentMethod === 'cash') {
        const treasuryRef = doc(db, 'treasury', 'master_ledger');
        const tSnap = await getDoc(treasuryRef);
        if (tSnap.exists()) {
          const tData = tSnap.data();
          await updateDoc(treasuryRef, {
            cash_collected: (tData.cash_collected || 0) + amt
          });
        } else {
          await setDoc(treasuryRef, {
            online_collected: 0,
            cash_collected: amt
          });
        }
      }

      setShowPopup(false);
      setSelectedStudent(null);
      setPaymentMethod(null);
      setAmountInput('');
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handleDeleteContributor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contributors', id));
    } catch (error) {
      console.error("Error deleting contributor:", error);
    }
  };

  const handleAddSubmit = async () => {
    try {
      const payload: any = {
        name: addFormData.name,
        status: 'unpaid',
        timestamp: new Date().toISOString()
      };
      
      if (addTab === 'Batch28') {
        payload.rollNumber = addFormData.rollNumber;
        payload.section = addFormData.section;
        payload.subSection = addFormData.subSection;
      } else {
        payload.phone = addFormData.phone;
        payload.section = 'Others';
        payload.subSection = 'Others';
      }

      await addDoc(collection(db, 'contributors'), payload);
      setShowAddPopup(false);
      setAddFormData({ rollNumber: '', name: '', phone: '', subSection: '', section: 'A' });
    } catch (error) {
      console.error("Error adding contributor:", error);
    }
  };

  const handleEditClick = (student: any) => {
    setEditFormData(student);
    setShowEditPopup(true);
  };

  const handleEditSubmit = async () => {
    if (!editFormData.id) return;
    try {
      const docRef = doc(db, 'contributors', editFormData.id);
      const updateData = { ...editFormData };
      delete updateData.id; // remove id before updating
      await updateDoc(docRef, updateData);
      setShowEditPopup(false);
    } catch (error) {
      console.error("Error updating contributor:", error);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Contributors - ${activeTab} - ${activeSection}`, 14, 15);
    
    const tableColumn = activeTab === 'Unpaid' 
      ? ["Roll No./Phone", "Name", "Subsection"]
      : ["Roll No./Phone", "Name", "Subsection", "Amount", "Method", "Recipient"];
      
    const tableRows = filteredData.map(student => {
      const iden = student.section === 'Others' ? student.phone || 'N/A' : student.rollNumber;
      if (activeTab === 'Unpaid') {
        return [iden, student.name, student.subSection?.toUpperCase()];
      } else {
        return [
          iden,
          student.name,
          student.subSection?.toUpperCase(),
          `Rs. ${student.amount}`,
          student.paymentMethod,
          student.recipient
        ];
      }
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Contributors_${activeTab}_${activeSection}.pdf`);
  };

  const downloadReceipt = (student: any) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5'
    });
    
    // Set font styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 53, 83);
    doc.text("SPARKZ 2K26", 105, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text("Freshers' For '29 Batch - Official Payment Receipt", 105, 28, { align: "center" });

    // Dashed line
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    doc.setLineDashPattern([], 0); // reset

    doc.setFontSize(10);
    
    let yPos = 45;
    const leftCol = 25;
    const rightCol = 185;

    // Helper to add row
    const addRow = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, leftCol, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(value, rightCol, yPos, { align: "right" });
      
      // Add a subtle line under each row
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(leftCol, yPos + 3, rightCol, yPos + 3);
      
      yPos += 10;
    };

    const dateStr = student.timestamp ? new Date(student.timestamp).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    
    addRow("Date of Issue:", dateStr);
    
    if (student.name) {
      addRow("Name:", student.name);
    }
    
    if (student.section !== 'Others' && student.rollNumber) {
      addRow("Roll Number:", student.rollNumber);
    }
    
    if (student.section && student.section !== 'Others') {
      const secStr = `${student.section}${student.subSection ? ` (${student.subSection})` : ''}`;
      addRow("Section:", secStr);
    }
    
    if (student.phone) {
      addRow("Phone Number:", student.phone);
    }
    
    if (student.paymentMethod) {
      const methodStr = student.paymentMethod.charAt(0).toUpperCase() + student.paymentMethod.slice(1);
      addRow("Payment Method:", methodStr);
    }

    // Amount Box
    yPos += 5;
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(20, yPos, 170, 12, 2, 2, "FD");
    
    // Blue accent line on left of box
    doc.setFillColor(40, 53, 83);
    doc.rect(20, yPos, 3, 12, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Amount Received:", 28, yPos + 8);
    doc.text(`Rs. ${student.amount}/-`, 185, yPos + 8, { align: "right" });
    
    // Fixed bottom Y for signature and stamp
    const bottomY = 125;
    
    // Signature
    let recipientName = student.recipient || "Admin";
    let recipientTitle = "(Admin)";
    const rLower = recipientName.toLowerCase();
    
    if (rLower.includes("anshuman")) {
      recipientName = "Anshuman Ganguli";
      recipientTitle = "(General Secretary)";
    } else if (rLower.includes("mrittika")) {
      recipientName = "Mrittika Biswas";
      recipientTitle = "(Treasurer)";
    } else if (rLower.includes("rajesh")) {
      recipientName = "Rajesh Biswas";
      recipientTitle = "(Treasurer)";
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(130, bottomY, 185, bottomY);
    doc.setTextColor(50, 50, 50);
    doc.text(recipientName, 157.5, bottomY + 5, { align: "center" });
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(recipientTitle, 157.5, bottomY + 9, { align: "center" });
    
    // Payment Processed Stamp
    doc.setDrawColor(46, 204, 113); // Green color
    doc.setTextColor(46, 204, 113);
    doc.setLineWidth(0.8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    
    const stampText = "PAYMENT PROCESSED";
    const textWidth = doc.getTextWidth(stampText);
    const stampW = textWidth + 10;
    const stampH = 12;
    
    // Draw straight stamp aligned with signature line
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, bottomY - stampH + 2, stampW, stampH, 2, 2, "DF"); 
    doc.text(stampText, 25, bottomY - stampH + 10.5); 

    // Outer Border
    doc.setDrawColor(40, 53, 83);
    doc.setLineWidth(0.8);
    doc.roundedRect(8, 8, 194, 132, 3, 3, "D");

    doc.save(`Receipt_${student.name || 'Student'}.pdf`);
  };

  return (
    <div className="bg-[#111111] p-6 rounded-xl border border-white/10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          CONTRIBUTORS
        </h2>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search by name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#d4ff00] transition-colors"
            />
          </div>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
        {['Unpaid', 'Paid'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#d4ff00] text-black'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-6 items-center flex-wrap">
        {['Sec A', 'Sec B', 'Others'].map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === sec
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
            }`}
          >
            {sec}
          </button>
        ))}
        <button
          onClick={() => setShowAddPopup(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#d4ff00]/20 text-[#d4ff00] hover:bg-[#d4ff00]/30 rounded-lg border border-[#d4ff00]/30 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Contributor</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="text-xs uppercase bg-white/5 text-white/60">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">
                {activeSection === 'Others' ? 'Phone' : 'Roll No.'}
              </th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Subsection</th>
              {activeTab === 'Unpaid' ? (
                <th className="px-6 py-4 rounded-tr-lg">Action</th>
              ) : (
                <>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Money Receipt</th>
                  <th className="px-6 py-4 rounded-tr-lg">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((student) => (
              <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono">
                  {student.section === 'Others' ? student.phone : student.rollNumber}
                </td>
                <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                <td className="px-6 py-4 uppercase">{student.subSection}</td>
                {activeTab === 'Unpaid' ? (
                  <td className="px-6 py-4">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleActionClick(student, 'online')}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/30 transition-colors text-xs"
                      >
                        Paid Online
                      </button>
                      <button
                        onClick={() => handleActionClick(student, 'cash')}
                        className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded border border-green-500/30 transition-colors text-xs"
                      >
                        Paid Cash
                      </button>
                      <button
                        onClick={() => handleDeleteContributor(student.id)}
                        className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors ml-2"
                        title="Delete Contributor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4 text-[#d4ff00] font-bold">₹{student.amount}</td>
                    <td className="px-6 py-4 capitalize">{student.paymentMethod}</td>
                    <td className="px-6 py-4">{student.recipient}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => downloadReceipt(student)}
                        className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded border border-blue-500/30 transition-colors flex items-center justify-center"
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleEditClick(student)}
                          className="p-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded border border-yellow-500/30 transition-colors"
                          title="Edit Contributor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContributor(student.id)}
                          className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors"
                          title="Delete Contributor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={activeTab === 'Unpaid' ? 4 : 7} className="px-6 py-8 text-center text-white/50">
                  No records found for {activeTab} in {activeSection}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50 p-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Record Payment</h3>
            <p className="text-white/70 text-sm mb-6">
              {selectedStudent?.name} ({selectedStudent?.section === 'Others' ? selectedStudent?.phone : selectedStudent?.rollNumber})<br/>
              Method: <span className="capitalize font-bold text-[#d4ff00]">{paymentMethod}</span>
            </p>

            <div className="flex justify-between gap-2 mb-4">
              {[501, 1001, 1501].map(amt => (
                <button
                  key={amt}
                  onClick={() => handlePredefinedAmount(amt)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Other amounts..."
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00] transition-colors mb-6"
            />

            <button
              onClick={handleSubmitPayment}
              disabled={!amountInput || Number(amountInput) <= 0}
              className="w-full py-3 bg-[#d4ff00] text-black font-bold rounded-lg hover:bg-[#b5d900] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Add Contributor Popup */}
      {showAddPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[60] p-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-md relative">
            <button onClick={() => setShowAddPopup(false)} className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Add Contributor</h3>
            
            <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
              <button
                onClick={() => setAddTab('Batch28')}
                className={`px-3 py-1.5 rounded text-sm ${addTab === 'Batch28' ? 'bg-[#d4ff00]/20 text-[#d4ff00]' : 'text-white/60 hover:text-white'}`}
              >
                Batch28
              </button>
              <button
                onClick={() => setAddTab('Others')}
                className={`px-3 py-1.5 rounded text-sm ${addTab === 'Others' ? 'bg-[#d4ff00]/20 text-[#d4ff00]' : 'text-white/60 hover:text-white'}`}
              >
                Others
              </button>
            </div>

            <div className="space-y-4">
              {addTab === 'Batch28' ? (
                <>
                  <input
                    type="text"
                    placeholder="Name"
                    value={addFormData.name}
                    onChange={e => setAddFormData({...addFormData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00]"
                  />
                  <input
                    type="text"
                    placeholder="Roll Number"
                    value={addFormData.rollNumber}
                    onChange={e => setAddFormData({...addFormData, rollNumber: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00]"
                  />
                  <div className="flex gap-4">
                    <select
                      value={addFormData.section}
                      onChange={e => setAddFormData({...addFormData, section: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#d4ff00]"
                    >
                      <option value="A" className="bg-[#111]">Sec A</option>
                      <option value="B" className="bg-[#111]">Sec B</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Subsection (e.g. A1)"
                      value={addFormData.subSection}
                      onChange={e => setAddFormData({...addFormData, subSection: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Name"
                    value={addFormData.name}
                    onChange={e => setAddFormData({...addFormData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00]"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={addFormData.phone}
                    onChange={e => setAddFormData({...addFormData, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#d4ff00]"
                  />
                </>
              )}
              
              <button
                onClick={handleAddSubmit}
                disabled={!addFormData.name || (addTab === 'Batch28' ? !addFormData.rollNumber : !addFormData.phone)}
                className="w-full py-3 bg-[#d4ff00] text-black font-bold rounded-lg hover:bg-[#b5d900] transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contributor Popup */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[60] p-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-md relative">
            <button onClick={() => setShowEditPopup(false)} className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Edit Contributor</h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={editFormData.name || ''}
                onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
              />
              {editFormData.section === 'Others' ? (
                <input
                  type="text"
                  placeholder="Phone"
                  value={editFormData.phone || ''}
                  onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Roll Number"
                    value={editFormData.rollNumber || ''}
                    onChange={e => setEditFormData({...editFormData, rollNumber: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <div className="flex gap-4">
                    <select
                      value={editFormData.section || 'A'}
                      onChange={e => setEditFormData({...editFormData, section: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="A" className="bg-[#111]">Sec A</option>
                      <option value="B" className="bg-[#111]">Sec B</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Subsection"
                      value={editFormData.subSection || ''}
                      onChange={e => setEditFormData({...editFormData, subSection: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </>
              )}
              {editFormData.status === 'paid' && (
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={editFormData.amount || ''}
                    onChange={e => setEditFormData({...editFormData, amount: Number(e.target.value)})}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <select
                    value={editFormData.paymentMethod || 'online'}
                    onChange={e => setEditFormData({...editFormData, paymentMethod: e.target.value})}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="online" className="bg-[#111]">Online</option>
                    <option value="cash" className="bg-[#111]">Cash</option>
                  </select>
                </div>
              )}
              
              <button
                onClick={handleEditSubmit}
                className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
