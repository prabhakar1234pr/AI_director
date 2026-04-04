"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle } from "../lib/firebase";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/director");
      else setLoading(false);
    });
    return unsub;
  }, [router]);

  async function handleSignIn() {
    setSigning(true);
    setError("");
    try {
      await signInWithGoogle();
      router.replace("/director");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 px-4" style={{ background: "#0A0A0F" }}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <Image src="/logo.png" alt="AI Director" width={120} height={120} priority className="drop-shadow-2xl" />
        <h1 className="text-4xl font-bold tracking-widest" style={{ color: "#8B5CF6", fontFamily: "Inter, sans-serif", letterSpacing: "0.2em" }}>
          AI DIRECTOR
        </h1>
        <p className="text-center text-sm max-w-sm" style={{ color: "#64748B" }}>
          Turn natural language scene descriptions into cinematic storyboards with AI-generated visuals, narration, and playback.
        </p>
      </div>

      {/* Sign-in */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={handleSignIn}
          disabled={signing}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)" }}
        >
          {signing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          {signing ? "Signing in…" : "Continue with Google"}
        </button>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      <p className="text-xs" style={{ color: "#1E1E2E" }}>
        Powered by MiniMax AI + ElevenLabs
      </p>
    </div>
  );
}
