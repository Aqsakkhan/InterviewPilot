import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts";
import { TrendingUp, Radar, FileText, Target } from "lucide-react";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import Skeleton from "../components/Skeleton";
import ErrorState from "../components/ErrorState";

const CHART_COLORS = {
    primary: "#3d6bff",
    secondary: "#8b5cf6",
    accent: "#22d3ee",
    success: "#34d399",
    warning: "#f59e0b",
};

const TOOLTIP_STYLE = {
    background: "#121a30",
    border: "1px solid rgba(232,236,246,0.1)",
    borderRadius: 8,
    fontSize: 12,
};

function formatDate(d) {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function EmptyChart({ message }) {
    return <p className="text-sm text-muted h-full flex items-center justify-center">{message}</p>;
}

export default function Progress() {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProgress = () => {
        setLoading(true);
        setError("");
        client
            .get("/interviews/stats/progress")
            .then(({ data }) => setProgress(data))
            .catch(() => setError("Couldn't load your progress data."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProgress();
    }, []);

    const interviewTrendData = useMemo(
        () =>
            (progress?.interviewTrend || []).map((d, i) => ({
                name: formatDate(d.date),
                score: d.score,
                type: d.type,
                index: i,
            })),
        [progress],
    );

    const skillProgressData = useMemo(
        () =>
            (progress?.skillProgress || []).map((d) => ({
                name: formatDate(d.date),
                Technical: d.technical,
                Communication: d.communication,
                Confidence: d.confidence,
                "Problem Solving": d.problemSolving,
            })),
        [progress],
    );

    const atsProgressData = useMemo(
        () =>
            (progress?.atsProgress || []).map((d) => ({
                name: formatDate(d.date),
                "ATS Score": d.atsScore,
                "Strength Score": d.strengthScore,
            })),
        [progress],
    );

    const readinessData = useMemo(() => {
        const map = new Map();
        (progress?.companyReadinessTrend || []).forEach((d) => {
            const key = d.date;
            map.set(key, { ...(map.get(key) || {}), name: formatDate(d.date), Company: d.score });
        });
        (progress?.roleReadinessTrend || []).forEach((d) => {
            const key = d.date;
            map.set(key, { ...(map.get(key) || {}), name: formatDate(d.date), Role: d.score });
        });
        return Array.from(map.values());
    }, [progress]);

    if (error) {
        return <ErrorState message={error} onRetry={fetchProgress} />;
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <Skeleton className="h-8 w-56 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
                <div className="grid sm:grid-cols-2 gap-4">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold">Progress tracking</h1>
                <p className="text-muted mt-1">How you're trending across interviews, skills, and readiness.</p>
            </div>

            {/* Interview trend */}
            <GlassCard className="p-6">
                <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-4">
                    <TrendingUp size={14} /> Interview trend
                </h3>
                <div className="h-56">
                    {interviewTrendData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={interviewTrendData}>
                                <CartesianGrid stroke="rgba(232,236,246,0.06)" vertical={false} />
                                <XAxis dataKey="name" stroke="#7c869d" fontSize={11} />
                                <YAxis domain={[0, 100]} stroke="#7c869d" fontSize={11} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Line type="monotone" dataKey="score" name="Overall score" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="Complete a few interviews to see your score trend." />
                    )}
                </div>
            </GlassCard>

            {/* Skill progress */}
            <GlassCard className="p-6">
                <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-4">
                    <Radar size={14} /> Skill progress
                </h3>
                <div className="h-56">
                    {skillProgressData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={skillProgressData}>
                                <CartesianGrid stroke="rgba(232,236,246,0.06)" vertical={false} />
                                <XAxis dataKey="name" stroke="#7c869d" fontSize={11} />
                                <YAxis domain={[0, 100]} stroke="#7c869d" fontSize={11} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="Technical" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Communication" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Confidence" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Problem Solving" stroke={CHART_COLORS.success} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="Complete a few interviews to see per-skill trends." />
                    )}
                </div>
            </GlassCard>

            <div className="grid sm:grid-cols-2 gap-4">
                {/* ATS progress */}
                <GlassCard className="p-6">
                    <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-4">
                        <FileText size={14} /> ATS progress
                    </h3>
                    <div className="h-48">
                        {atsProgressData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={atsProgressData}>
                                    <CartesianGrid stroke="rgba(232,236,246,0.06)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#7c869d" fontSize={11} />
                                    <YAxis domain={[0, 100]} stroke="#7c869d" fontSize={11} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Line type="monotone" dataKey="ATS Score" stroke={CHART_COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Strength Score" stroke={CHART_COLORS.warning} strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="Re-upload or re-analyze your resume to build history." />
                        )}
                    </div>
                </GlassCard>

                {/* Company & role readiness */}
                <GlassCard className="p-6">
                    <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-4">
                        <Target size={14} /> Company & role readiness
                    </h3>
                    <div className="h-48">
                        {readinessData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={readinessData}>
                                    <CartesianGrid stroke="rgba(232,236,246,0.06)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#7c869d" fontSize={11} />
                                    <YAxis domain={[0, 100]} stroke="#7c869d" fontSize={11} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Line type="monotone" dataKey="Company" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="Role" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart message="Complete an interview to see readiness trends." />
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
