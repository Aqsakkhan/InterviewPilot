import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  Code2,
  MessageSquare,
  FolderKanban,
  BookOpen,
  Sparkles,
  UploadCloud,
  Gauge,
  History,
  Target,
  Award,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import GlassCard from "../components/GlassCard";
import ScoreRing from "../components/ScoreRing";

const QUICK_ACTIONS = [
  { type: "full_placement", label: "Start Mock Interview", icon: Sparkles, tone: "from-primary to-secondary" },
  { type: "dsa", label: "DSA Round", icon: Code2, tone: "from-accent to-primary" },
  { type: "hr", label: "HR Round", icon: MessageSquare, tone: "from-secondary to-primary" },
  { type: "project_viva", label: "Project Viva", icon: FolderKanban, tone: "from-success to-accent" },
  { type: "technical", label: "Technical Round", icon: BookOpen, tone: "from-warning to-secondary" },
];

const TYPE_LABEL = {
  hr: "HR Interview",
  technical: "Technical Interview",
  dsa: "DSA Interview",
  project_viva: "Project Viva",
  full_placement: "Full Placement Interview",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [resume, setResume] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/interviews/stats/summary").then(({ data }) => setStats(data));
    client
      .get("/resume/me")
      .then(({ data }) => {
        setResume(data);
        setHasResume(true);
      })
      .catch(() => {
        setResume(null);
        setHasResume(false);
      });
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "";

  const greeting = (() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 || hour < 4) return "Good Evening";

    return "Good Night";
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (profile && !profile.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  const chartData = (stats?.weeklyProgress || []).map((w) => ({ name: w.week.split("-W")[1] ? `W${w.week.split("-W")[1]}` : w.week, score: w.avgScore }));

  // Resume Health: blend of ATS score and resume strength score, when available.
  const resumeHealth =
    resume?.analysis && (resume.analysis.atsScore != null || resume.analysis.strengthScore != null)
      ? Math.round(
        ((resume.analysis.atsScore ?? resume.analysis.strengthScore) +
          (resume.analysis.strengthScore ?? resume.analysis.atsScore)) /
        2,
      )
      : null;

  const recommended = stats?.nextRecommendedInterview;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          {greeting}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>

        <p className="text-muted mt-1">
          Ready for today's interview?
        </p>
      </div>

      {!hasResume && (
        <GlassCard className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UploadCloud className="text-accent" size={20} />
            <p className="text-sm text-ink">Upload your resume to unlock personalized questions.</p>
          </div>
          <Link
            to="/resume-upload"
            className="focus-ring text-sm px-4 py-2 rounded-lg bg-primary text-white whitespace-nowrap hover:bg-primary-dim transition-colors"
          >
            Upload now
          </Link>
        </GlassCard>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-lg font-medium mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map(({ type, label, icon: Icon, tone }) => (
            <Link key={type} to={`/interview/new?type=${type}`}>
              <GlassCard className="p-5 h-full hover:bg-white/6 transition-colors">
                <span className={`grid place-items-center w-10 h-10 rounded-lg bg-linear-to-br ${tone} mb-3`}>
                  <Icon size={18} className="text-white" />
                </span>
                <p className="font-medium text-sm">{label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Performance overview */}
      <div>
        <h2 className="font-display text-lg font-medium mb-4">Performance overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-semibold">{stats?.interviewsCompleted ?? "-"}</span>
            <span className="text-xs text-muted mt-1 font-mono uppercase tracking-wide">Interviews completed</span>
          </GlassCard>
          <GlassCard className="p-6 flex items-center justify-center">
            <ScoreRing score={stats?.averageScore ?? 0} label="Average score" />
          </GlassCard>
          <GlassCard className="p-6 flex items-center justify-center">
            <ScoreRing score={stats?.interviewReadiness ?? 0} label="Readiness" />
          </GlassCard>
          <GlassCard className="p-6 flex items-center justify-center">
            {resumeHealth != null ? (
              <ScoreRing score={resumeHealth} label="Resume health" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <Gauge size={28} className="text-muted" />
                <span className="text-xs text-muted font-mono uppercase tracking-wide">Upload resume for health score</span>
              </div>
            )}
          </GlassCard>
        </div>

        <GlassCard className="p-6 mt-4">
          <span className="text-xs text-muted font-mono uppercase tracking-wide">Weekly progress</span>
          <div className="h-32 mt-3">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(232,236,246,0.06)" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#121a30", border: "1px solid rgba(232,236,246,0.1)", borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#22d3ee" fill="url(#scoreFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted h-full flex items-center">Complete an interview to see your trend.</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Last score / weak skill / strong skill */}
      {stats?.interviewsCompleted > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <GlassCard className="p-6">
            <span className="text-xs text-muted font-mono uppercase tracking-wide">Last score</span>
            <p className="font-display text-3xl font-semibold mt-2">
              {stats.lastScore != null ? Math.round(stats.lastScore) : "-"}
            </p>
          </GlassCard>
          <GlassCard className="p-6">
            <h3 className="flex items-center gap-2 text-success text-xs font-mono uppercase tracking-wide">
              <Award size={14} /> Strong skill
            </h3>
            <p className="text-sm text-ink mt-2">{stats.strongSkill || "Complete more interviews to see this"}</p>
          </GlassCard>
          <GlassCard className="p-6">
            <h3 className="flex items-center gap-2 text-warning text-xs font-mono uppercase tracking-wide">
              <AlertCircle size={14} /> Weak skill
            </h3>
            <p className="text-sm text-ink mt-2">{stats.weakSkill || "Complete more interviews to see this"}</p>
          </GlassCard>
        </div>
      )}

      {/* Recent interview / next recommended */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-3">
            <History size={14} /> Recent interview
          </h3>
          {stats?.recentInterview ? (
            <Link
              to={`/report/${stats.recentInterview.id}`}
              className="focus-ring flex items-center justify-between gap-3 group"
            >
              <div>
                <p className="font-medium">{TYPE_LABEL[stats.recentInterview.type] || stats.recentInterview.type}</p>
                <p className="text-xs text-muted mt-1">
                  {[stats.recentInterview.company, stats.recentInterview.jobRole, formatDate(stats.recentInterview.completedAt)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-display text-xl font-semibold">
                  {stats.recentInterview.overallScore != null ? Math.round(stats.recentInterview.overallScore) : "-"}
                </span>
                <ArrowUpRight size={16} className="text-muted group-hover:text-accent transition-colors" />
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted">No interviews completed yet.</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted mb-3">
            <Target size={14} /> Next recommended interview
          </h3>
          {recommended ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{TYPE_LABEL[recommended.type] || recommended.type}</p>
                <p className="text-xs text-muted mt-1">{recommended.reason}</p>
              </div>
              <Link
                to={`/interview/new?type=${recommended.type}`}
                className="focus-ring shrink-0 text-xs px-3 py-2 rounded-lg bg-primary text-white whitespace-nowrap hover:bg-primary-dim transition-colors"
              >
                Start
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">Complete an interview to get a recommendation.</p>
          )}
        </GlassCard>
      </div>

      {resume && (
        <div>
          <h2 className="font-display text-lg font-medium mb-4">Resume summary</h2>
          <GlassCard className="p-6 grid sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-muted font-mono uppercase">Strong areas</span>
              <p className="text-sm mt-1">{resume.strongAreas?.slice(0, 4).join(", ") || "-"}</p>
            </div>
            <div>
              <span className="text-xs text-muted font-mono uppercase">Weak areas</span>
              <p className="text-sm mt-1">{resume.weakAreas?.slice(0, 4).join(", ") || "-"}</p>
            </div>
            <div>
              <span className="text-xs text-muted font-mono uppercase">Skills tracked</span>
              <p className="text-sm mt-1">{resume.skills?.length || 0}</p>
              <button
                onClick={() => navigate("/resume-report")}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary-dim transition-colors"
              >
                View Full Resume Report →
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
