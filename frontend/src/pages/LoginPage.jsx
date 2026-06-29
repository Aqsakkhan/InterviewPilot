import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Github, Mail, Lock, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
    );
}

export default function LoginPage() {
    const { firebaseUser, profile, authError, loading, loginWithEmail, signInWithGoogle, signInWithGithub } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");
    const [submitting, setSubmitting] = useState("");

    useEffect(() => {
        if (firebaseUser) navigate(profile?.profileComplete ? "/dashboard" : "/profile-setup", { replace: true });
    }, [firebaseUser, profile, navigate]);

    const runLogin = async (method, label) => {
        setLocalError("");
        setSubmitting(label);
        try {
            const userProfile = await method();
            navigate(userProfile?.profileComplete ? "/dashboard" : "/profile-setup", { replace: true });
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setSubmitting("");
        }
    };

    const handleEmailLogin = (e) => {
        e.preventDefault();
        runLogin(() => loginWithEmail(email, password), "email");
    };

    const busy = Boolean(submitting) || loading;

    return (
        <div className="min-h-screen grid place-items-center px-6 py-12">
            <div className="app-backdrop" />
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="flex items-center justify-center gap-2 mb-8 font-display font-semibold text-xl">
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-linear-to-br from-primary to-secondary">
                        <Sparkles size={17} className="text-white" />
                    </span>
                    InterviewPilot <span className="text-accent">AI</span>
                </div>

                <GlassCard strong className="p-8">
                    <h1 className="font-display text-3xl font-semibold text-center">Welcome Back</h1>
                    <p className="text-muted text-sm text-center mt-2">Choose exactly how you want to sign in.</p>

                    <form onSubmit={handleEmailLogin} className="space-y-4 mt-8">
                        <div>
                            <label className="text-sm text-muted mb-1.5 block">Email Address</label>
                            <div className="relative">
                                <Mail size={17} className="absolute left-3 top-3.5 text-muted" />
                                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring w-full bg-white/5 border border-line rounded-xl pl-10 pr-3 py-3 text-ink placeholder:text-muted/60" placeholder="you@example.com" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-muted mb-1.5 block">Password</label>
                            <div className="relative">
                                <Lock size={17} className="absolute left-3 top-3.5 text-muted" />
                                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring w-full bg-white/5 border border-line rounded-xl pl-10 pr-3 py-3 text-ink placeholder:text-muted/60" placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={busy} className="focus-ring w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors disabled:opacity-60">
                            {submitting === "email" ? "Logging in..." : "Login"} <ArrowRight size={16} />
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-6 text-xs text-muted"><span className="h-px flex-1 bg-line" /> OR <span className="h-px flex-1 bg-line" /></div>

                    <div className="space-y-3">
                        <button type="button" disabled={busy} onClick={() => runLogin(signInWithGoogle, "google")} className="focus-ring w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-line bg-white/5 text-ink hover:bg-white/10 transition-colors disabled:opacity-60">
                            <GoogleIcon /> {submitting === "google" ? "Opening Google..." : "Continue with Google"}
                        </button>
                    </div>

                    {(localError || authError) && <p className="text-sm text-red-400 mt-5 text-center">{localError || authError}</p>}
                </GlassCard>
            </motion.div>
        </div>
    );
}
