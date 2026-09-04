"use client";

import Link from "next/link";
import { Orbitron } from "next/font/google";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700"] });

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    try {
      setIsLoading(true);
      if (!auth) {
        throw new Error("Firebase Auth is not initialized. Please check your .env.local configuration.");
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Fallback for components still relying on localStorage
      localStorage.setItem("token", userCredential.user.uid);
      router.push("/register");
    } catch (error: any) {
      console.error("Sign up error:", error);
      alert(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      if (!auth) {
        throw new Error("Firebase Auth is not initialized. Please check your .env.local configuration.");
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Fallback for components still relying on localStorage
      localStorage.setItem("token", result.user.uid);
      router.push("/register");
    } catch (error) {
      console.error("Google sign up error:", error);
      alert("Failed to sign up with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 pt-16">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15),transparent_60%)] rounded-full blur-3xl"></div>
      </div>

      {/* Form Container */}
      <div className="z-10 w-full max-w-md bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative my-8">
        <h1
          className={`${orbitron.className} text-4xl md:text-5xl text-center font-bold mb-8 tracking-wider text-[#00E5FF] glow-cyan`}
        >
          SIGN UP
        </h1>

        <form onSubmit={handleEmailSignUp} className="space-y-6 flex flex-col" autoComplete="off">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                required
                autoComplete="off"
              />
            </div>
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                required
                autoComplete="off"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00E5FF] text-black font-bold text-lg py-4 mt-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            style={{
              clipPath: "polygon(5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%, 0% 50%)",
            }}
          >
            {isLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-sm text-gray-400 font-medium tracking-widest">
            OR
          </span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full bg-white text-black font-semibold rounded-full px-6 py-3 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-70"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {isLoading ? "Processing..." : "Sign up with Google"}
        </button>

        {/* Footer Links */}
        <div className="mt-8 flex flex-col items-center space-y-3">
          <p className="text-sm text-gray-300">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#00E5FF] hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
