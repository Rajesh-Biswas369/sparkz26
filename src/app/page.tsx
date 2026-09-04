"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, Users, Wallet, Target, MessageSquare, PenTool, Camera, Music, Truck, ShieldCheck } from "lucide-react";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"],
  });

  // Outline-to-fill text animation trigger (Left to Right)
  const textFillClip = useTransform(scrollYProgress, [0.85, 1], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);

  // Glowing ball vertical position
  const ballY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Exact Target Date: September 26, 2026 at 10:00:00 AM
    const targetDate = new Date("2026-09-26T10:00:00");
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timelineEvents = [
    { time: "10:00 AM", title: "Gates Open", desc: "Welcome to the Electric realm." },
    { time: "10:30 AM", title: "Freshers' Breakfast", desc: "Fuel up for the day." },
    { time: "11:30 AM", title: "Cultural Performances", desc: "Showcase of talents." },
    { time: "2:00 PM", title: "The Grand Feast", desc: "A meal to remember." },
    { time: "7:00 PM", title: "The End", desc: "The night is young, but the memories are forever." },
  ];

  const teamMembers = [
    { role: "General Secretary", names: ["Ayushman Ganguli"], Icon: Star },
    { role: "Joint Secretary", names: ["Dwaipayan Gon Bannerjee", "Aditya Bhattacharyya", "Trisha Bhadra"], Icon: Users },
    { role: "Treasurer", names: ["Rajesh Biswas", "Mrittika Biswas"], Icon: Wallet },
    { role: "Convenor", names: ["Saumyadeep Nandi"], Icon: Target },
    { role: "PR", names: ["Soumyajit Ghosh (SYG)", "Adrija Das"], Icon: MessageSquare },
    { role: "Design Team", names: ["Anik Khanra", "Bornita Mandal", "Disha Mahato", "Prakriti Ghosh", "Remon Saha"], Icon: PenTool },
    { role: "Photography", names: ["Debdeep Das", "Krishna Agarwal"], Icon: Camera },
    { role: "Cultural Team", names: ["Souvik Barua Chowdhury", "Trisha Bhadra", "Esha Bhadra", "Mohema Bhuiya", "Shubhrima Talukder", "Saumyadeep Nandi", "Swapnendu Sikdar"], Icon: Music },
    { role: "Logistic", names: ["Souvik Barua Chowdhury", "Prosmit Das", "Rohit Pal / Rohit Mondal", "Sk Yaser Arafat", "Abhik Chatterjee", "Tanmoy Mahata", "Supratim Das", "Santanu Saha", "Habibul Haque (Logistics+Food)", "Shanku Das", "Shraban Mudi"], Icon: Truck },
    { role: "Registration & Discipline", names: ["Rajesh Biswas", "Kalpak Majumdar", "Debjit Goswami"], Icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-[#E07020] selection:text-white pt-6 px-4 md:px-12">
      
      {/* Background Atmosphere for Mascot (Right side) */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#E07020]/15 rounded-full blur-[150px] mix-blend-screen pointer-events-none translate-x-1/4 -translate-y-1/4 z-0"></div>

      {/* Hero Grid */}
      <main className="relative z-10 flex-grow grid md:grid-cols-2 gap-12 w-full max-w-7xl mx-auto items-center pb-20 pt-24">
        
        {/* LEFT COLUMN: Typography & Branding */}
        <div className="flex flex-col items-start space-y-6">
          
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-['Orbitron',sans-serif] text-[#00E5FF] tracking-[0.3em] text-sm md:text-base uppercase font-bold"
          >
            J.U.E.E PRESENTS
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="border border-white/20 bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-lg shadow-[0_0_30px_rgba(0,229,255,0.1)] border-l-4 border-l-[#00E5FF] w-full max-w-lg relative overflow-hidden"
          >
             {/* Subtle reflection overlay inside the box */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
            
            <h1 className="liquid-text font-['Orbitron',sans-serif] text-5xl md:text-7xl font-black uppercase tracking-wider leading-tight drop-shadow-[0_0_10px_rgba(0,229,255,0.3)] relative z-10">
              SPARKZ<br/>2k26
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="space-y-2"
          >
            <p className="font-['Inter',sans-serif] text-slate-400 text-lg md:text-xl">
              The Official Freshers' Welcome of
            </p>
            <h2 className="font-['Orbitron',sans-serif] text-2xl md:text-3xl font-bold text-white uppercase tracking-widest">
              ELECTRICAL ENGINEERING DEPARTMENT
            </h2>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Official Logo & Countdown */}
        <div className="flex flex-col items-center justify-center space-y-12">
          
          {/* Floating Logo Area */}
          <motion.div 
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Pulsing glow behind the logo */}
            <motion.div 
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 blur-3xl rounded-full bg-[#00E5FF]/30 z-0"
            />
            
            <div className="relative z-10 shadow-[0_0_40px_rgba(0,229,255,0.3)] rounded-2xl overflow-hidden border border-white/10">
              <Image 
                src="/sparkz-logo.jpg" 
                alt="SPARKZ 2k26" 
                width={450} 
                height={450} 
                className="rounded-2xl object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* Countdown Timer */}
          <div className="flex gap-4 md:gap-6 font-['Orbitron',sans-serif]">
            {[
              { label: "DAYS", value: timeLeft.days },
              { label: "HOURS", value: timeLeft.hours },
              { label: "MINS", value: timeLeft.minutes },
              { label: "SECS", value: timeLeft.seconds },
            ].map((unit, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="bg-black/60 border border-[#00E5FF]/40 text-[#00E5FF] text-2xl md:text-4xl font-black p-3 md:p-4 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.15)] rounded-sm">
                  {isMounted ? unit.value.toString().padStart(2, "0") : "00"}
                </div>
                <span className="text-[10px] md:text-xs text-slate-400 mt-2 tracking-[0.2em] font-medium">{unit.label}</span>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* EVENT TIMELINE SECTION */}
      <section id="events" className="relative z-10 w-full py-24 border-t border-white/10 mt-10 overflow-visible">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-5xl mx-auto px-4"
        >
          <h2 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
            The <span className="text-[#00E5FF]">Timeline</span>
          </h2>
          <p className="font-['Inter',sans-serif] text-slate-400 mt-4 max-w-2xl mx-auto">
            The sequence of events for the ultimate freshers' welcome.
          </p>
        </motion.div>

        <div ref={timelineRef} className="relative w-full flex flex-col items-center">
          
          <div className="relative w-full max-w-5xl mx-auto py-10 px-4">
            {/* Straight Glowing Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-[#00E5FF] via-[#00E5FF]/50 to-transparent shadow-[0_0_15px_rgba(0,229,255,0.8)] rounded-full z-0">
              {/* Falling Glowing Ball */}
              <motion.div 
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_5px_rgba(255,255,255,1)] z-20"
                style={{ top: ballY }}
              />
            </div>

            <div className="flex flex-col space-y-24 relative z-10">
              {timelineEvents.map((event, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -150 : 150 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-150px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className={`flex items-center w-full ${idx % 2 === 0 ? 'justify-start' : 'justify-end'} relative`}
                >
                  {/* Connecting Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-[#050505] border-4 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.8)] z-10"></div>
                  
                  {/* Content Box */}
                  <div className={`w-5/12 ${idx % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-[#E07020]/50 transition-colors duration-300">
                      <span className="font-['Orbitron',sans-serif] text-[#E07020] font-bold text-lg tracking-widest">{event.time}</span>
                      <h3 className="font-['Orbitron',sans-serif] text-xl font-bold text-white mt-2 uppercase">{event.title}</h3>
                      <p className="font-['Inter',sans-serif] text-slate-400 mt-2">{event.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeline Finale: SPARKZ26 Fill Animation */}
          <div className="relative w-full flex justify-center items-center z-10 pt-10 pb-20 px-8">
            {/* Outline Text */}
            <h1 className="font-['Orbitron',sans-serif] text-[16vw] md:text-[12vw] font-black text-transparent relative z-10 uppercase tracking-tighter leading-none flex pr-4">
              <span style={{ WebkitTextStroke: "2px rgba(255, 255, 255, 0.4)" }}>SPARK</span>
              <span style={{ WebkitTextStroke: "2px rgba(255, 215, 0, 0.6)" }}>Z26</span>
            </h1>
            
            {/* Filled Text (Animated Clip Path) */}
            <motion.h1 
              className="font-['Orbitron',sans-serif] text-[16vw] md:text-[12vw] font-black absolute z-20 uppercase tracking-tighter leading-none flex pr-4"
              style={{ clipPath: textFillClip }}
            >
              <span className="text-white" style={{ textShadow: "0 0 40px rgba(255,255,255,0.8)" }}>SPARK</span>
              <span className="text-[#FFD700]" style={{ textShadow: "0 0 40px rgba(255,215,0,0.8)" }}>Z26</span>
            </motion.h1>
          </div>
        </div>
      </section>

      {/* CORE TEAM SECTION */}
      <section id="core-team" className="relative z-10 w-full max-w-7xl mx-auto py-24 border-t border-white/10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(224,112,32,0.5)]">
            Core <span className="text-[#E07020]">Team</span>
          </h2>
          <p className="font-['Inter',sans-serif] text-slate-400 mt-4 max-w-2xl mx-auto">
            The minds and muscle behind SPARKZ 2k26.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 4) * 0.1 }}
              whileHover={{ y: -10 }}
              className="backdrop-blur-md bg-white/5 border border-[#00E5FF]/20 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center shadow-[0_0_20px_rgba(0,229,255,0.05)] hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:border-[#00E5FF]/50 transition-all duration-300 h-full"
            >
              {/* Avatar Icon */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#E07020] mb-6 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] p-1 shrink-0">
                <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center text-white">
                  <member.Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
              </div>
              
              <h3 className="font-['Orbitron',sans-serif] text-lg md:text-xl font-bold text-[#00E5FF] uppercase mb-4 w-full tracking-wider">
                {member.role}
              </h3>
              
              <div className="font-['Inter',sans-serif] text-slate-200 mt-auto flex flex-col space-y-1.5 w-full text-sm md:text-base leading-relaxed">
                {member.names.map((name, nIdx) => (
                  <span key={nIdx} className="break-words">
                    {member.names.length > 1 && <span className="text-[#E07020] mr-2 text-lg leading-none">•</span>}
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
