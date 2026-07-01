import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    RefreshCcw,
    Download,
    Sparkles,
    Lightbulb,
    ChevronDown,
} from "lucide-react";

import client from "../api/client";
import GlassCard from "../components/GlassCard";
import InterviewerOrb from "../components/InterviewerOrb";
import ScoreRing from "../components/ScoreRing";

/* ── Constants ── */

const SKILL_CATEGORY_LABELS = {
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
};

// Mirrors ROLE_KEYWORDS keys from backend/services/resume-analysis/constants.js
// No API call needed — these are static and match the backend exactly.
const AVAILABLE_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "SDE",
    "Data Analyst",
    "Other",
];

/* ── Main Component ── */

export default function ResumeReport() {

    const navigate = useNavigate();

    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reanalyzing, setReanalyzing] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Selected role for analysis — defaults to whatever role
    // was used for the stored analysis, not the user's profile role.
    // This keeps the dropdown in sync with what's currently displayed.
    const [selectedRole, setSelectedRole] = useState("");

    // Load the stored resume on mount
    useEffect(() => {
        client
            .get("/resume/me")
            .then(({ data }) => {
                setResume(data);
                // Pre-select the role that was used for the current analysis
                setSelectedRole(data?.analysis?.targetRole || "");
            })
            .catch(() => setResume(null))
            .finally(() => setLoading(false));
    }, []);

    /**
     * Called when:
     *   1. User changes the role dropdown  → pass the new role
     *   2. User clicks "Re-analyze" button → pass the current selectedRole
     */
    const handleAnalyze = async (role) => {
        setReanalyzing(true);
        setError("");
        try {
            const { data } = await client.post("/resume/analyze", { role });
            setResume(data);
            // Keep dropdown in sync with what was actually analyzed
            setSelectedRole(data?.analysis?.targetRole || role);
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
            const response = await client.get("/resume/analysis/pdf", {
                responseType: "blob",
            });
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
            setError("Couldn't generate the analysis PDF. Try re-analyzing first.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    /* ── Loading / empty states (unchanged) ── */

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center">
                <InterviewerOrb state="thinking" size={80} />
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <GlassCard className="p-8 text-center">
                    <h2 className="text-xl font-semibold">No Resume Found</h2>
                    <button
                        onClick={() => navigate("/resume-upload")}
                        className="mt-6 bg-primary px-5 py-3 rounded-xl text-white"
                    >
                        Upload Resume
                    </button>
                </GlassCard>
            </div>
        );
    }

    if (!resume.analysis) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <GlassCard className="p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">
                        Resume not analyzed yet
                    </h2>
                    <button
                        onClick={() => handleAnalyze(selectedRole)}
                        className="mt-4 bg-primary px-5 py-3 rounded-xl text-white"
                    >
                        Analyze Resume
                    </button>
                </GlassCard>
            </div>
        );
    }

    const analysis = resume.analysis;

    return (
        <div className="min-h-screen flex justify-center p-6">

            {error && (
                <GlassCard className="mb-4 border border-red-500/30 p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </GlassCard>
            )}

            <GlassCard strong className="w-full max-w-3xl p-8">

                {/* ── Header row ── */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-accent" />
                        <h2 className="font-display text-lg font-semibold">
                            Resume Intelligence
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAnalyze(selectedRole)}
                            disabled={reanalyzing}
                            className="focus-ring inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-ink text-xs hover:bg-white/5 transition-colors disabled:opacity-60"
                        >
                            <RefreshCcw size={12} />
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

                {/* ── Role selector ── */}
                <div className="mb-8">
                    <label className="text-xs font-mono uppercase tracking-wide text-muted mb-2 block">
                        Analyze Resume For
                    </label>
                    <div className="relative w-full sm:w-72">
                        <select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            disabled={reanalyzing}
                            className="w-full appearance-none bg-white/5 border border-line rounded-xl px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60 cursor-pointer pr-10"
                        >
                            {AVAILABLE_ROLES.map((role) => (
                                <option
                                    key={role}
                                    value={role}
                                    className="bg-surface text-ink"
                                >
                                    {role}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                        />
                    </div>
                    {reanalyzing && (
                        <p className="text-xs text-muted mt-2 animate-pulse">
                            Analyzing for {selectedRole}...
                        </p>
                    )}
                </div>

                {/* ── Score rings ── */}
                <div className="flex flex-wrap items-center gap-8 mb-8">
                    <ScoreRing score={analysis.atsScore} size={110} label="ATS Score" />
                    <ScoreRing
                        score={analysis.strengthScore}
                        size={110}
                        label="Resume Strength"
                    />
                    <div>
                        <span className="text-xs font-mono uppercase tracking-wide text-muted">
                            Experience Level
                        </span>
                        <p className="text-ink font-medium mt-1">
                            {analysis.experienceLevel}
                        </p>
                        <span className="text-xs font-mono uppercase tracking-wide text-muted mt-3 block">
                            Analyzed for
                        </span>
                        <p className="text-ink font-medium mt-1">
                            {analysis.targetRole}
                        </p>
                    </div>
                </div>

                {/* ── Skill categories ── */}
                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                    {Object.entries(SKILL_CATEGORY_LABELS).map(([key, label]) => (
                        <SkillCategoryCard
                            key={key}
                            title={label}
                            items={analysis.skillCategories?.[key] || []}
                        />
                    ))}
                    <SkillCategoryCard
                        title="Soft Skills Detected"
                        items={analysis.softSkillsDetected || []}
                        tone="accent"
                        emptyText="None detected from resume text."
                    />
                </div>

                {/* ── Keyword match ── */}
                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                    <SkillCategoryCard
                        title={`Matched Keywords (${analysis.targetRole})`}
                        items={analysis.matchedKeywords || []}
                        tone="success"
                        emptyText="No role keywords matched yet."
                    />
                    <SkillCategoryCard
                        title="Missing Skills to Consider"
                        items={analysis.missingSkills || []}
                        tone="warning"
                        emptyText="Nothing missing — great keyword coverage!"
                    />
                </div>

                {/* ── Improvement tips ── */}
                <div>
                    <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-3">
                        <Lightbulb size={14} /> Improvement Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-ink">
                        {(analysis.improvementTips || []).length ? (
                            analysis.improvementTips.map((tip, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-accent shrink-0">!</span> {tip}
                                </li>
                            ))
                        ) : (
                            <li className="text-muted">
                                No high-priority issues detected.
                            </li>
                        )}
                    </ul>
                </div>

            </GlassCard>
        </div>
    );
}

/* ── Local helper component (unchanged) ── */

function SkillCategoryCard({ title, items = [], tone = "default", emptyText }) {
    if (!items.length && !emptyText) return null;
    const chipClass = CHIP_TONE[tone] || CHIP_TONE.default;
    return (
        <div>
            <h4 className="text-xs font-mono uppercase tracking-wide text-muted mb-2">
                {title}
            </h4>
            {items.length ? (
                <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                        <span
                            key={item}
                            className={`text-xs px-2.5 py-1 rounded-full border ${chipClass}`}
                        >
                            {item}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted">{emptyText}</p>
            )}
        </div>
    );
}
