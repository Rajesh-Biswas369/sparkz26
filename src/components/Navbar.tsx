"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("admin_role");
      setIsLoggedIn(false);
      setIsMobileMenuOpen(false);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      const element = document.getElementById('core-team');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in (either student token or admin role)
    const token = localStorage.getItem("token");
    const adminRole = localStorage.getItem("admin_role");
    
    if (token || adminRole) {
      setIsLoggedIn(true);
    }

    // Also listen to Firebase auth state globally
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
        } else if (!localStorage.getItem("token") && !localStorage.getItem("admin_role")) {
          // Only set to false if no legacy token exists either
          setIsLoggedIn(false);
        }
      });
    }

    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "Contact", href: "/#core-team" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 md:px-12">
          <Link href="/" className="flex items-center cursor-pointer">
            <Image 
              src="/sparkz-logo.jpg" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="rounded-full inline-block mr-3 border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.3)]" 
            />
            <span className="font-['Orbitron',sans-serif] font-bold text-xl tracking-wider text-[#00E5FF]">SPARKZ'26</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                scroll={true}
                onClick={link.name === "Contact" ? handleContactClick : undefined}
              >
                <button 
                  className="backdrop-blur-md bg-white/5 border border-[#00E5FF]/40 text-white px-6 py-2 text-sm font-['Orbitron',sans-serif] tracking-widest hover:bg-[#00E5FF] hover:text-black transition-colors duration-300 uppercase"
                  style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
                >
                  {link.name}
                </button>
              </Link>
            ))}

            {isLoggedIn ? (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/dashboard">
                  <button 
                    className="backdrop-blur-md bg-[#00E5FF]/20 border border-[#00E5FF] text-white px-6 py-2 text-sm font-['Orbitron',sans-serif] tracking-widest hover:bg-[#00E5FF] hover:text-black transition-colors duration-300 uppercase shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                    style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
                  >
                    Dashboard
                  </button>
                </Link>
                {pathname !== "/dashboard" && (
                  <button 
                    onClick={handleLogout}
                    className="backdrop-blur-md bg-[#E07020]/20 border border-[#E07020] text-white px-6 py-2 text-sm font-['Orbitron',sans-serif] tracking-widest hover:bg-[#E07020] hover:text-white transition-colors duration-300 uppercase shadow-[0_0_15px_rgba(224,112,32,0.2)]"
                    style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <Link href="/login" className="ml-2">
                <button 
                  className="backdrop-blur-md bg-[#E07020]/20 border border-[#E07020] text-white px-6 py-2 text-sm font-['Orbitron',sans-serif] tracking-widest hover:bg-[#E07020] hover:text-white transition-colors duration-300 uppercase shadow-[0_0_15px_rgba(224,112,32,0.2)]"
                  style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
                >
                  Login
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-[#00E5FF] p-2 hover:bg-white/5 rounded-md transition-colors"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col pt-6 px-6"
          >
            <div className="flex justify-between items-center w-full mb-12">
              <div className="flex items-center">
                <Image 
                  src="/sparkz-logo.jpg" 
                  alt="Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-full inline-block mr-3 border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.3)]" 
                />
                <span className="font-['Orbitron',sans-serif] font-bold text-xl tracking-wider text-[#00E5FF]">SPARKZ'26</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            <div className="flex flex-col gap-6 items-center w-full">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="w-full" 
                  onClick={(e) => {
                    if (link.name === "Contact") {
                      handleContactClick(e as unknown as React.MouseEvent<HTMLAnchorElement>);
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }} 
                  scroll={true}
                >
                  <button 
                    className="w-full bg-white/5 border border-[#00E5FF]/40 text-white py-4 text-lg font-['Orbitron',sans-serif] tracking-widest active:bg-[#00E5FF] active:text-black transition-colors uppercase"
                    style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0 100%)" }}
                  >
                    {link.name}
                  </button>
                </Link>
              ))}

              {isLoggedIn ? (
                <div className="flex flex-col gap-4 w-full mt-4">
                  <Link href="/dashboard" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <button 
                      className="w-full bg-[#00E5FF]/20 border border-[#00E5FF] text-white py-4 text-lg font-['Orbitron',sans-serif] tracking-widest active:bg-[#00E5FF] active:text-black transition-colors uppercase shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                      style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0 100%)" }}
                    >
                      Dashboard
                    </button>
                  </Link>
                  {pathname !== "/dashboard" && (
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-[#E07020]/20 border border-[#E07020] text-white py-4 text-lg font-['Orbitron',sans-serif] tracking-widest active:bg-[#E07020] active:text-white transition-colors uppercase shadow-[0_0_15px_rgba(224,112,32,0.2)]"
                      style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0 100%)" }}
                    >
                      Logout
                    </button>
                  )}
                </div>
              ) : (
                <Link href="/login" className="w-full mt-4" onClick={() => setIsMobileMenuOpen(false)}>
                  <button 
                    className="w-full bg-[#E07020]/20 border border-[#E07020] text-white py-4 text-lg font-['Orbitron',sans-serif] tracking-widest active:bg-[#E07020] active:text-white transition-colors uppercase shadow-[0_0_15px_rgba(224,112,32,0.2)]"
                    style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0 100%)" }}
                  >
                    Login
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
