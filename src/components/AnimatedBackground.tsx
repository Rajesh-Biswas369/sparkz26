"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [sparks, setSparks] = useState<{ id: number; top: string; left: string; duration: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    // Generate sparks only on client to avoid hydration mismatch
    const newSparks = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 3 + 2, // 2-5s
      delay: Math.random() * 2,
      size: Math.random() * 4 + 2, // 2-6px
    }));
    setSparks(newSparks);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {/* 1. Base Background Color */}
      <div className="fixed inset-0 bg-[#050505] z-0 pointer-events-none" />

      {/* 2. Interactive Cursor Spotlight */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 229, 255, 0.08), transparent 80%)`
        }}
      />

      {/* 3. Ambient Background Sparks */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {sparks.map((spark) => (
          <motion.div
            key={spark.id}
            className="absolute rounded-full bg-[#00E5FF] blur-[1px]"
            style={{
              top: spark.top,
              left: spark.left,
              width: spark.size,
              height: spark.size,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.8, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: spark.duration,
              repeat: Infinity,
              delay: spark.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </>
  );
}
