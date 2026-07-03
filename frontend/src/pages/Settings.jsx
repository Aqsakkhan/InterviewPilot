import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    User,
    FileText,
    Volume2,
    SlidersHorizontal,
    Palette,
    ChevronRight,
    Check,
} from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DURATIONS = [10, 20, 30, 45];
const COMPANIES = [
    "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Adobe",
    "Oracle", "Salesforce", "JP Morgan Chase", "Goldman Sachs", "Deloitte",
    "Accenture", "Infosys", "TCS",
];

function SettingsRow({ icon: Icon, title, description, to }) {
    return (
        <Link to={to} className="focus-ring flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-white/5 text-accent shrink-0">
                <Icon size={18} />
            </span>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{title}</p>
                <p className="text-xs text-muted mt-0.5">{description}</p>
            </div>
            <ChevronRight size={16} className="text-muted shrink-0" />
        </Link>
    );
}

function ToggleRow({ label, description, checked, onChange }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div>
                <p className="text-sm text-ink">{label}</p>
                {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                role="switch"
                aria-checked={checked}
                className={`focus-ring shrink-0 w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-white/10"
                    }`}
            >
                <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"
                        }`}
                />
            </button>
        </div>
    );
}

export default function Settings() {
    const { profile, refreshProfile } = useAuth();
    const [hasResume, setHasResume] = useState(false);

    const [voice, setVoice] = useState({ autoRead: true, rate: 1, pitch: 1 });
    const [interviewDefaults, setInterviewDefaults] = useState({
        defaultDifficulty: "intermediate",
        defaultDurationMinutes: 20,
        defaultCompany: "Google",
    });
    const [reduceMotion, setReduceMotion] = useState(false);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        client.get("/resume/me").then(() => setHasResume(true)).catch(() => setHasResume(false));
    }, []);

    useEffect(() => {
        if (!profile?.preferences) return;
        const p = profile.preferences;
        setVoice({
            autoRead: p.voice?.autoRead ?? true,
            rate: p.voice?.rate ?? 1,
            pitch: p.voice?.pitch ?? 1,
        });
        setInterviewDefaults({
            defaultDifficulty: p.interview?.defaultDifficulty || "intermediate",
            defaultDurationMinutes: p.interview?.defaultDurationMinutes || 20,
            defaultCompany: p.interview?.defaultCompany || "Google",
        });
        setReduceMotion(Boolean(p.reduceMotion));
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await client.put("/users/preferences", {
                voice,
                interview: interviewDefaults,
                reduceMotion,
            });
            await refreshProfile();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">Settings</h1>

            {/* Account */}
            <GlassCard className="p-2">
                <SettingsRow icon={User} title="Profile" description="Name, email, account status" to="/profile" />
                <SettingsRow
                    icon={FileText}
                    title="Resume"
                    description={hasResume ? "View your resume report" : "Upload your resume"}
                    to={hasResume ? "/resume-report" : "/resume-upload"}
                />
            </GlassCard>

            {/* Voice settings */}
            <GlassCard className="p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-medium mb-1">
                    <Volume2 size={18} className="text-accent" /> Voice settings
                </h2>
                <p className="text-sm text-muted mb-4">Controls how questions are read aloud during interviews.</p>

                <ToggleRow
                    label="Auto-read questions"
                    description="Automatically speak each new question aloud"
                    checked={voice.autoRead}
                    onChange={(v) => setVoice((s) => ({ ...s, autoRead: v }))}
                />

                <div className="py-3 border-t border-line">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-ink">Speech rate</span>
                        <span className="text-muted font-mono">{voice.rate.toFixed(1)}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voice.rate}
                        onChange={(e) => setVoice((s) => ({ ...s, rate: Number(e.target.value) }))}
                        className="w-full accent-primary"
                    />
                </div>

                <div className="py-3 border-t border-line">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-ink">Voice pitch</span>
                        <span className="text-muted font-mono">{voice.pitch.toFixed(1)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={voice.pitch}
                        onChange={(e) => setVoice((s) => ({ ...s, pitch: Number(e.target.value) }))}
                        className="w-full accent-primary"
                    />
                </div>
            </GlassCard>

            {/* Interview preferences */}
            <GlassCard className="p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-medium mb-1">
                    <SlidersHorizontal size={18} className="text-primary" /> Interview preferences
                </h2>
                <p className="text-sm text-muted mb-4">Defaults used whenever you start a new interview.</p>

                <div className="mb-4">
                    <label className="text-xs font-mono uppercase tracking-wide text-muted">Default difficulty</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {DIFFICULTIES.map((d) => (
                            <button
                                key={d}
                                onClick={() => setInterviewDefaults((s) => ({ ...s, defaultDifficulty: d }))}
                                className={`focus-ring capitalize p-2.5 rounded-xl border text-sm transition-colors ${interviewDefaults.defaultDifficulty === d
                                        ? "border-secondary bg-secondary/10 text-ink"
                                        : "border-line text-muted hover:bg-white/5"
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-xs font-mono uppercase tracking-wide text-muted">Default duration</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {DURATIONS.map((d) => (
                            <button
                                key={d}
                                onClick={() => setInterviewDefaults((s) => ({ ...s, defaultDurationMinutes: d }))}
                                className={`focus-ring p-2.5 rounded-xl border text-sm transition-colors ${interviewDefaults.defaultDurationMinutes === d
                                        ? "border-secondary bg-secondary/10 text-ink"
                                        : "border-line text-muted hover:bg-white/5"
                                    }`}
                            >
                                {d}m
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-mono uppercase tracking-wide text-muted">Default company</label>
                    <select
                        value={interviewDefaults.defaultCompany}
                        onChange={(e) => setInterviewDefaults((s) => ({ ...s, defaultCompany: e.target.value }))}
                        className="focus-ring w-full mt-2 bg-white/5 border border-line rounded-xl p-3 text-ink"
                    >
                        {COMPANIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </GlassCard>

            {/* Theme / accessibility */}
            <GlassCard className="p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-medium mb-1">
                    <Palette size={18} className="text-secondary" /> Theme
                </h2>
                <p className="text-sm text-muted mb-2">
                    InterviewPilot AI uses a single dark theme. You can reduce motion below if animations are distracting.
                </p>
                <ToggleRow
                    label="Reduce motion"
                    description="Turns off page transitions and shimmer animations"
                    checked={reduceMotion}
                    onChange={setReduceMotion}
                />
            </GlassCard>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="focus-ring inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dim transition-colors disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save settings"}
                </button>
                {saved && (
                    <span className="flex items-center gap-1.5 text-sm text-success">
                        <Check size={14} /> Saved
                    </span>
                )}
            </div>
        </div>
    );
}
