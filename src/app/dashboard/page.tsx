"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";

// Import Role Dashboards
import AdminGodDashboard from "@/components/dashboards/AdminGodDashboard";
import MasterAdminDashboard from "@/components/dashboards/MasterAdminDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import Batch28Dashboard from "@/components/dashboards/Batch28Dashboard";
import Batch29Dashboard from "@/components/dashboards/Batch29Dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleForceLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("admin_role");
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const usersRef = collection(db, "users");
        // Query by user email
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // No user document found, redirect to register
          router.push("/register");
        } else {
          // Document exists, extract role or batch
          const data = querySnapshot.docs[0].data();
          setUserData(data);
          const userRole = data.role || data.batch || "unknown";
          setRole(userRole.toString().toLowerCase());
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Database Connection Error: Unable to reach Firestore. Please check your internet connection, disable ad-blockers, or refresh the page.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#E07020]/10 rounded-full blur-[120px] mix-blend-screen"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="relative z-10 w-full max-w-md pt-24 pb-12 flex justify-center"
        >
          <div className="text-center p-8 bg-black/40 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-[0_0_40px_rgba(255,0,0,0.15)] mx-auto w-full">
            <h2 className="text-2xl text-white mb-4 font-['Orbitron',sans-serif] uppercase text-red-400">Access Denied</h2>
            <p className="text-slate-400 font-['Inter',sans-serif] mb-6">{error}</p>
            <button 
              onClick={handleForceLogout}
              className="backdrop-blur-md bg-[#E07020]/20 border border-[#E07020] text-white px-6 py-3 text-sm font-['Orbitron',sans-serif] tracking-widest hover:bg-[#E07020] hover:text-white transition-colors duration-300 uppercase shadow-[0_0_15px_rgba(224,112,32,0.2)] w-full"
              style={{ clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0 100%)" }}
            >
              Force Logout
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (role) {
      case "admingod":
      case "admin_god":
        return <AdminGodDashboard userData={userData} />;
      case "masteradmin":
      case "master_admin":
        return <MasterAdminDashboard userData={userData} />;
      case "admin":
        return <AdminDashboard userData={userData} />;
      case "28":
      case "batch28":
        return <Batch28Dashboard />;
      case "29":
      case "batch29":
        return <Batch29Dashboard userData={userData} />;
      default:
        return (
          <div className="text-center p-8 bg-black/40 backdrop-blur-md border border-red-500/30 rounded-2xl shadow-[0_0_40px_rgba(255,0,0,0.15)] mx-auto max-w-md">
            <h2 className="text-2xl text-white mb-2 font-['Orbitron',sans-serif] uppercase">Unknown Identity</h2>
            <p className="text-slate-400 font-['Inter',sans-serif]">Role not recognized by the mainframe.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden w-full">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#E07020]/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-start p-4 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-7xl pt-24 pb-12 flex justify-center"
        >
          {renderDashboard()}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
