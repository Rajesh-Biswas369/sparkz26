"use client";
import React from "react";
import { Orbitron } from "next/font/google";
import { motion } from "framer-motion";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] min-h-screen w-full flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-md">
      {/* 
        NOTE: If you build a custom 3D model on spline.design in the future,
        you can drop the <Spline> component URL here to replace this Energy Core.
      */}
      
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        {/* Core Glow */}
        <div 
          className="absolute w-10 h-10 bg-[#00E5FF] rounded-full"
          style={{ boxShadow: "0 0 50px 10px #00E5FF" }}
        />
        
        {/* Orbit Ring 1 (X, Y, Z rotation) */}
        <motion.div
          className="absolute w-32 h-32 border-2 border-[#00E5FF]/40 rounded-full"
          style={{ borderTopColor: "#E07020" }}
          animate={{ rotateX: 360, rotateY: 180, rotateZ: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbit Ring 2 */}
        <motion.div
          className="absolute w-40 h-40 border-2 border-[#00E5FF]/30 rounded-full"
          style={{ borderRightColor: "#00E5FF" }}
          animate={{ rotateX: -180, rotateY: 360, rotateZ: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbit Ring 3 */}
        <motion.div
          className="absolute w-24 h-24 border-2 border-[#E07020]/50 rounded-full"
          style={{ borderBottomColor: "#00E5FF" }}
          animate={{ rotateX: 360, rotateY: -360, rotateZ: 180 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.h2 
        className={`${orbitron.className} text-xl text-[#00E5FF] font-bold tracking-widest uppercase drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]`}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Loading...
      </motion.h2>
    </div>
  );
}
