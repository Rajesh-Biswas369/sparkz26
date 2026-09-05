import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 w-full bg-black/60 backdrop-blur-lg border-t border-white/10 pt-16 pb-8 px-4 md:px-12 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
        {/* Column 1: Brand */}
        <div className="flex flex-col space-y-4">
          <span className="font-['Orbitron',sans-serif] text-white tracking-[0.2em] text-xs uppercase font-bold">
            J.U.E.E. Presents
          </span>
          <h2 className="liquid-text font-['Orbitron',sans-serif] text-3xl font-black uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,229,255,0.3)] w-fit">
            SPARKZ 2k26
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            The official freshers' welcome of the Electrical Engineering Department at Jadavpur University.
          </p>
        </div>

        {/* Column 2: Navigation */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-['Orbitron',sans-serif] text-white font-bold tracking-widest mb-2 uppercase">Explore</h3>
          <Link href="/" className="text-slate-400 hover:text-[#00E5FF] transition-colors text-sm w-fit">Home</Link>
          <Link href="/events" className="text-slate-400 hover:text-[#00E5FF] transition-colors text-sm w-fit">Events</Link>
          <Link href="/#contact" className="text-slate-400 hover:text-[#00E5FF] transition-colors text-sm w-fit">Contact</Link>
        </div>

        {/* Column 3: Located At */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-['Orbitron',sans-serif] text-white font-bold tracking-widest mb-2 uppercase">Located At</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Electrical Engineering Department, Jadavpur University, 188, Raja S.C. Mallick Road, Kolkata - 700032, West Bengal, India
          </p>
        </div>

        {/* Column 4: Follow Us & Legal */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-['Orbitron',sans-serif] text-white font-bold tracking-widest mb-2 uppercase">Follow Us</h3>
          <div className="flex space-x-4 mb-6">
            <a href="https://www.instagram.com/sparkz2k26?igsi=cWQydHd6NWc5cXlr" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 rounded-full hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] transition-all text-slate-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
          <h3 className="font-['Orbitron',sans-serif] text-white font-bold tracking-widest mb-2 uppercase text-xs">Legal</h3>
          <div className="flex flex-col space-y-2">
            <a href="/pdfs/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm w-fit underline decoration-white/20 underline-offset-4">Privacy Policy</a>
            <a href="/pdfs/terms.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors text-sm w-fit underline decoration-white/20 underline-offset-4">Terms</a>
          </div>
        </div>

        {/* Column 5: Creator */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-['Orbitron',sans-serif] text-white font-bold tracking-widest mb-2 uppercase">Creator</h3>
          <div className="flex flex-col">
            <span className="liquid-text font-['Orbitron',sans-serif] text-xl font-black uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,229,255,0.3)] w-fit">
              RAJESH BISWAS
            </span>
          </div>
          <div className="flex flex-col space-y-3 pt-2">
            <a href="https://wa.me/919874952304" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-slate-400 hover:text-[#25D366] transition-colors text-sm w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
              <span>WhatsApp</span>
            </a>
            <a href="https://www.instagram.com/its_rajesh11b/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-slate-400 hover:text-[#E1306C] transition-colors text-sm w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              <span>Instagram</span>
            </a>
            <a href="https://www.linkedin.com/in/rajesh-biswas-1025a7418/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-slate-400 hover:text-[#0077b5] transition-colors text-sm w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              <span>LinkedIn</span>
            </a>
            <a href="mailto:rajeshbiswas0510@gmail.com" className="flex items-center space-x-2 text-slate-400 hover:text-[#EA4335] transition-colors text-sm w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>Gmail</span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 pt-8 mt-8 text-center flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()} SPARKZ 2k26. All rights reserved.
        </p>
        <p className="text-slate-500 text-xs mt-2 md:mt-0">
          Designed for J.U.E.E. Batch of '29
        </p>
      </div>
    </footer>
  );
}
