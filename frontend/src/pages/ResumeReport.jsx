import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    RefreshCcw, Download, Sparkles, Lightbulb,
    ChevronDown, FileText, CheckCircle2, XCircle,
    TrendingUp, Award, Briefcase, BookOpen,
    ChevronUp, AlertTriangle, Info, Clock,
    Target, Layers, Code2, Database, Cloud, Wrench,
} from "lucide-react";

import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";
import ScoreRing from "../components/ScoreRing";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */

const AVAILABLE_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "SDE",
    "Data Analyst",
    "Other",
];

const CATEGORY_ICONS = {
    languages: Code2,
    frameworks: Layers,
    databases: Database,
    cloudDevops: Cloud,
    tools: Wrench,
    other: Sparkles,
};

const CATEGORY_LABELS = {
    languages: "Languages",
    frameworks: "Frameworks",
    databases: "Databases",
    cloudDevops: "Cloud & DevOps",
    tools: "Tools",
    other: "Other",
};

const CHIP_TONE = {
    default: "text-ink border-line bg-white/5",
    success: "text-success border-success/30 bg-success/5",
    warning: "text-warning border-warning/30 bg-warning/5",
    accent: "text-accent border-accent/30 bg-accent/5",
    danger: "text-red-400 border-red-400/30 bg-red-400/5",
};

function scoreLabel(score) {
    if (score >= 80) return { text: "Excellent", color: "text-success", bg: "bg-success/10 border-success/30" };
    if (score >= 65) return { text: "Good", color: "text-accent", bg: "bg-accent/10 border-accent/30" };
    if (score >= 45) return { text: "Average", color: "text-warning", bg: "bg-warning/10 border-warning/30" };
    return { text: "Needs Work", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" };
}

function timeAgo(date) {
    if (!date) return "";
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

export default function ResumeReport() {
    const navigate = useNavigate();

    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reanalyzing, setReanalyzing] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");
    const [showAllTips, setShowAllTips] = useState(false);

    useEffect(() => {
        client.get("/resume/me")
            .then(({ data }) => {
                setResume(data);
                setSelectedRole(data?.analysis?.targetRole || "");
            })
            .catch(() => setResume(null))
            .finally(() => setLoading(false));
    }, []);

    const handleAnalyze = async (role) => {
        setReanalyzing(true);
        setError("");
        try {
            const { data } = await client.post("/resume/analyze", { role });
            setResume(data);
            setSelectedRole(data?.analysis?.targetRole || role);
            setShowAllTips(false);
        } catch (err) {
            setError(err.response?.data?.message || "Couldn't re-analyze your resume.");
        } finally {
            setReanalyzing(false);
        }
    };

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setSelectedRole(newRole);
        handleAnalyze(newRole);
    };

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        setError("");
        try {
            const response = await client.get("/resume/analysis/pdf", { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(
                new Blob([response.data], { type: "application/pdf" })
            );
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = "resume-analysis.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            setError("Couldn't generate the PDF. Try re-analyzing first.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    /* ── Guards ── */

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center">
                <InterviewerOrb state="thinking" size={80} />
                <p className="text-muted text-sm mt-4 font-mono animate-pulse">
                    Loading your resume report...
                </p>
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <GlassCard className="p-10 text-center max-w-md w-full">
                    <FileText size={40} className="mx-auto text-muted mb-4" />
                    <h2 className="text-xl font-semibold">No Resume Found</h2>
                    <p className="text-muted text-sm mt-2">
                        Upload your resume to get a detailed intelligence report.
                    </p>
                    <button
                        onClick={() => navigate("/resume-upload")}
                        className="mt-6 bg-primary px-6 py-3 rounded-xl text-white font-medium hover:bg-primary-dim transition-colors"
                    >
                        Upload Resume
                    </button>
                </GlassCard>
            </div>
        );
    }

    if (!resume.analysis) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <GlassCard className="p-10 text-center max-w-md w-full">
                    <Sparkles size={40} className="mx-auto text-accent mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Resume Not Analyzed Yet</h2>
                    <p className="text-muted text-sm mt-1">
                        Run the analysis engine to see your ATS score, skill gaps, and improvement tips.
                    </p>
                    <button
                        onClick={() => handleAnalyze(selectedRole)}
                        className="mt-6 bg-primary px-6 py-3 rounded-xl text-white font-medium hover:bg-primary-dim transition-colors"
                    >
                        Analyze Now
                    </button>
                </GlassCard>
            </div>
        );
    }

    const a = resume.analysis;
    const atsLabel = scoreLabel(a.atsScore);
    const strengthLabel = scoreLabel(a.strengthScore);
    const keywordPct = a.matchedKeywords?.length && (a.matchedKeywords.length + (a.missingSkills?.length || 0)) > 0
        ? Math.round((a.matchedKeywords.length / (a.matchedKeywords.length + (a.missingSkills?.length || 0))) * 100)
        : 0;
    const totalKeywords = (a.matchedKeywords?.length || 0) + (a.missingSkills?.length || 0);
    const topTips = a.improvementTips || [];
    const allTips = a.suggestions || [];
    const extraTips = allTips.filter((t) => !topTips.includes(t));

    return (
        <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto space-y-6">
            <div className="app-backdrop" />

            {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* ══════════════════════════════
                1 — Page Header
            ══════════════════════════════ */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={18} className="text-accent" />
                        <h1 className="font-display text-2xl font-bold">Resume Intelligence</h1>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                            <FileText size={12} /> {resume.fileName}
                        </span>
                        {a.analyzedAt && (
                            <span className="flex items-center gap-1.5 text-xs text-muted">
                                <Clock size={12} /> Analyzed {timeAgo(a.analyzedAt)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => handleAnalyze(selectedRole)}
                        disabled={reanalyzing}
                        className="focus-ring inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-ink text-xs hover:bg-white/5 transition-colors disabled:opacity-60"
                    >
                        <RefreshCcw size={12} className={reanalyzing ? "animate-spin" : ""} />
                        {reanalyzing ? "Analyzing..." : "Re-analyze"}
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="focus-ring inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs hover:bg-primary-dim transition-colors disabled:opacity-60"
                    >
                        <Download size={12} />
                        {downloadingPdf ? "Preparing..." : "Download PDF"}
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════
                2 — Role Selector
            ══════════════════════════════ */}
            <GlassCard className="p-5">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Target size={16} className="text-accent" />
                        <span className="text-sm font-medium">Analyzing for:</span>
                    </div>
                    <div className="relative">
                        <select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            disabled={reanalyzing}
                            className="appearance-none bg-white/5 border border-line rounded-lg px-4 py-2 pr-8 text-ink text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60 cursor-pointer"
                        >
                            {AVAILABLE_ROLES.map((role) => (
                                <option key={role} value={role} className="bg-surface text-ink">
                                    {role}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                    {reanalyzing && (
                        <span className="text-xs text-accent animate-pulse">
                            Recalculating analysis...
                        </span>
                    )}
                    <p className="text-xs text-muted ml-auto">
                        Your saved profile role is not affected by this selection.
                    </p>
                </div>
            </GlassCard>

            {/* ══════════════════════════════
                3 — Score Summary Banner
            ══════════════════════════════ */}
            <GlassCard strong className="p-6">
                <h2 className="text-xs font-mono uppercase tracking-wide text-muted mb-5">
                    Overall Assessment
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">

                    {/* ATS Score */}
                    <div className="flex flex-col items-center gap-3">
                        <ScoreRing score={a.atsScore} size={100} />
                        <div className="text-center">
                            <p className="text-xs text-muted font-mono uppercase">ATS Score</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block ${atsLabel.bg} ${atsLabel.color}`}>
                                {atsLabel.text}
                            </span>
                        </div>
                    </div>

                    {/* Resume Strength */}
                    <div className="flex flex-col items-center gap-3">
                        <ScoreRing score={a.strengthScore} size={100} />
                        <div className="text-center">
                            <p className="text-xs text-muted font-mono uppercase">Resume Strength</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block ${strengthLabel.bg} ${strengthLabel.color}`}>
                                {strengthLabel.text}
                            </span>
                        </div>
                    </div>

                    {/* Keyword Coverage */}
                    <div className="flex flex-col items-center gap-3">
                        <ScoreRing score={keywordPct} size={100} />
                        <div className="text-center">
                            <p className="text-xs text-muted font-mono uppercase">Keyword Match</p>
                            <p className="text-xs text-muted mt-1">
                                {a.matchedKeywords?.length || 0} of {totalKeywords} keywords
                            </p>
                        </div>
                    </div>

                    {/* Resume Stats */}
                    <div className="flex flex-col justify-center gap-3 text-sm">
                        <StatRow icon={Briefcase} label="Projects" value={resume.projects?.length || 0} />
                        <StatRow icon={TrendingUp} label="Skills" value={resume.skills?.length || 0} />
                        <StatRow icon={BookOpen} label="Experience" value={resume.experience?.length || 0} />
                        <StatRow icon={Award} label="Certs" value={resume.certifications?.length || 0} />
                    </div>
                </div>

                {/* Experience level */}
                <div className="mt-6 pt-5 border-t border-line flex items-center gap-2">
                    <Info size={14} className="text-muted shrink-0" />
                    <p className="text-sm text-ink">
                        <span className="text-muted">Experience Level: </span>
                        {a.experienceLevel}
                    </p>
                </div>
            </GlassCard>

            {/* ══════════════════════════════
                4 — What Needs to Change
                    (Priority Action Items)
            ══════════════════════════════ */}
            {topTips.length > 0 && (
                <GlassCard className="p-6 border border-warning/20">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={16} className="text-warning" />
                        <h2 className="font-display font-semibold text-base">
                            What Needs to Change
                        </h2>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-warning/10 border border-warning/30 text-warning">
                            {topTips.length} priority {topTips.length === 1 ? "fix" : "fixes"}
                        </span>
                    </div>

                    <ul className="space-y-3">
                        {topTips.map((tip, i) => (
                            <li key={i} className="flex gap-3 items-start">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs flex items-center justify-center font-bold mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-ink leading-relaxed">{tip}</p>
                            </li>
                        ))}
                    </ul>

                    {/* All suggestions collapsible */}
                    {extraTips.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-line">
                            <button
                                onClick={() => setShowAllTips((v) => !v)}
                                className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                            >
                                {showAllTips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showAllTips ? "Hide" : `View ${extraTips.length} more suggestion${extraTips.length > 1 ? "s" : ""}`}
                            </button>

                            {showAllTips && (
                                <ul className="space-y-2 mt-3">
                                    {extraTips.map((tip, i) => (
                                        <li key={i} className="flex gap-2 items-start text-sm text-muted">
                                            <Lightbulb size={13} className="text-accent shrink-0 mt-0.5" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </GlassCard>
            )}

            {/* ══════════════════════════════
                5 — Keyword Coverage
            ══════════════════════════════ */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-accent" />
                    <h2 className="font-display font-semibold text-base">
                        Keyword Coverage — {a.targetRole}
                    </h2>
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                    <div className="flex justify-between text-xs text-muted mb-1.5">
                        <span>{a.matchedKeywords?.length || 0} matched</span>
                        <span>{keywordPct}% coverage</span>
                        <span>{a.missingSkills?.length || 0} missing</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-700"
                            style={{ width: `${keywordPct}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted mt-1.5">
                        {keywordPct >= 70
                            ? "✓ Strong keyword coverage for this role."
                            : keywordPct >= 45
                                ? "⚠ Moderate coverage — add missing skills to improve ATS ranking."
                                : "✗ Low coverage — recruiters may filter this resume out before a human reads it."}
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-mono uppercase tracking-wide text-success mb-2 flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Matched Keywords
                        </p>
                        {a.matchedKeywords?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                                {a.matchedKeywords.map((kw) => (
                                    <Chip key={kw} label={kw} tone="success" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted">No keywords matched yet.</p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-mono uppercase tracking-wide text-warning mb-2 flex items-center gap-1.5">
                            <XCircle size={12} /> Missing Keywords
                        </p>
                        {a.missingSkills?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                                {a.missingSkills.map((kw) => (
                                    <Chip key={kw} label={kw} tone="warning" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-success">
                                Nothing missing — great coverage!
                            </p>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* ══════════════════════════════
                6 — Skill Categories
            ══════════════════════════════ */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Layers size={16} className="text-accent" />
                    <h2 className="font-display font-semibold text-base">
                        Your Skill Profile
                    </h2>
                    <span className="ml-auto text-xs text-muted">
                        {resume.skills?.length || 0} skills detected
                    </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                        const items = a.skillCategories?.[key] || [];
                        const Icon = CATEGORY_ICONS[key] || Sparkles;
                        return (
                            <div
                                key={key}
                                className={`rounded-xl border p-4 ${items.length ? "border-line bg-white/3" : "border-line/40 bg-white/[0.01] opacity-50"}`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon size={14} className="text-accent" />
                                    <span className="text-xs font-mono uppercase tracking-wide text-muted">
                                        {label}
                                    </span>
                                    <span className="ml-auto text-xs text-muted">{items.length}</span>
                                </div>
                                {items.length ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {items.map((item) => (
                                            <Chip key={item} label={item} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted">None detected</p>
                                )}
                            </div>
                        );
                    })}

                    {/* Soft skills */}
                    <div className={`rounded-xl border p-4 ${a.softSkillsDetected?.length ? "border-accent/20 bg-accent/5" : "border-line/40 opacity-50"}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Award size={14} className="text-accent" />
                            <span className="text-xs font-mono uppercase tracking-wide text-muted">
                                Soft Skills
                            </span>
                            <span className="ml-auto text-xs text-muted">
                                {a.softSkillsDetected?.length || 0}
                            </span>
                        </div>
                        {a.softSkillsDetected?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                                {a.softSkillsDetected.map((item) => (
                                    <Chip key={item} label={item} tone="accent" />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted">
                                Mention teamwork, leadership, or communication in your descriptions.
                            </p>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* ══════════════════════════════
                7 — Footer actions
            ══════════════════════════════ */}
            <div className="flex gap-3 justify-end pb-6">
                <button
                    onClick={() => navigate("/resume-upload")}
                    className="focus-ring inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-ink text-sm hover:bg-white/5 transition-colors"
                >
                    <RefreshCcw size={14} /> Replace Resume
                </button>
                <button
                    onClick={() => navigate("/interview/new")}
                    className="focus-ring inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dim transition-colors"
                >
                    <Sparkles size={14} /> Start Interview
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function Chip({ label, tone = "default" }) {
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full border ${CHIP_TONE[tone] || CHIP_TONE.default}`}>
            {label}
        </span>
    );
}

function StatRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted text-xs">
                <Icon size={13} />
                {label}
            </div>
            <span className="text-ink font-semibold text-sm">{value}</span>
        </div>
    );
}
